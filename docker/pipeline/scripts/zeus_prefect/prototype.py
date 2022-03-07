import os

from collections import defaultdict

import prefect

from prefect import Flow, Task
from prefect.engine import signals
from prefect.tasks.shell import ShellTask
from pylib.base.flags import Flags
from pylib.file.file_utils import FileUtils
from pylib.zeus.pipeline_config import PipelineConfig
from pylib.zeus.pipeline_utils import PipelineUtils
from pylib.zeus.runner import Runner
from pylib.zeus.zeus import Zeus

# Disabling the protected access lint error since we are trying to reproduce the
# behavior of Zeus inside Prefect. This requires using the Zeus internals to construct
# our pipelines properly.
# pylint: disable=protected-access

# Environment variables that are needed to run Python if you have not manually entered
# the virtualenv.
PYTHON_ENV_VARS = ('ZEN_ENV', 'VIRTUAL_ENV', 'PATH', 'PYTHONPATH')


def initialize_zeus(command_line_args):
    '''Initialize the Zeus module and all sub modules that it touches.'''

    # Zeus is primarily a command line driven application. To program on top of it, we
    # need to supply arguments in a different way than on the command line.
    def mock_args(cls):
        cls.ARGS = cls.PARSER.parse_args(command_line_args)

    setattr(Flags, 'InitArgs', classmethod(mock_args))
    zeus = Zeus()
    zeus._Init()
    return zeus


def sort_zeus_task(zeus_task: str):
    '''Provide a sortable key for this zeus task that will sort first by priority level
    and then by filename.
    '''
    priority = PipelineUtils.GetTaskPriority(zeus_task)
    task_name = PipelineUtils.TaskRelativeName(zeus_task)
    suffix = os.path.basename(task_name).split('_', 1)[1]
    return f'{priority}_{suffix}'


def get_zeus_tasks(root_env):
    '''Get a sorted list of zeus tasks that are being run.'''
    cwd = os.getcwd()

    # For Zeus to initialize tasks properly, we must be inside the pipeline directory.
    os.chdir(os.path.dirname(Flags.ARGS.root))
    zeus_task_groups = Runner._ComputeTasks(Flags.ARGS.task, Flags.ARGS.ignore_tasks)
    Runner._CreateDirsForTasks(zeus_task_groups)
    sorted_tasks = sorted(
        [task for task_set in zeus_task_groups.values() for task in task_set],
        key=sort_zeus_task,
    )
    output = []
    for task in sorted_tasks:
        task_name = PipelineUtils.TaskRelativeName(task)
        task_env = {**root_env, **Runner._Runner__GetEnvVarsForTask(task)}
        log_file = PipelineUtils.GetLogFileForTask(task)
        output.append((task, task_name, task_env, log_file))

    os.chdir(cwd)
    return output


def calculate_priority(task_name, places):
    if not task_name:
        return -1

    pieces = [int(piece.split('_', 1)[0]) for piece in task_name.split('/')]
    output = 0
    for i, piece in enumerate(pieces):
        # NOTE(stephen): Using a size of 4 for ... reasons.
        offset = 1000 ** (places - i)
        output += offset * piece
    return output


def iterate_ordered_groups(item_list):
    groups = defaultdict(list)
    places = max(item.name.count('/') for item in item_list)
    for item in item_list:
        # Determine the priority of the task being run. Use the priority prefix attached
        # to the task name. If no task name exists, then we are working with the root
        # task.
        priority = -1
        if item.name:
            priority = calculate_priority(item.name, places)
        groups[priority].append(item)

    priority_order = sorted(groups.keys())
    priority_count = len(priority_order)
    if priority_count == 0:
        return

    for i, priority in enumerate(priority_order):
        upstream_items = groups[priority_order[i - 1]] if i > 0 else []
        downstream_items = (
            groups[priority_order[i + 1]] if i < priority_count - 1 else []
        )
        current_items = groups[priority]
        yield (current_items, upstream_items, downstream_items)


def set_leaf_task_dependencies(task_list, parent_name):
    '''Given a list of Prefect tasks with Zeus names, use the priority specified in the
    task name to setup the dependency graph for the pipeline.

    Returns the tasks that have no upstream dependent tasks.
    '''
    flow = Flow(parent_name)
    assert task_list, 'There must be at least one task defined for the group'
    if len(task_list) == 1:
        flow.add_task(task_list[0])
        return flow

    for tasks, upstream_tasks, downstream_tasks in iterate_ordered_groups(task_list):
        for task in tasks:
            flow.set_dependencies(
                task, upstream_tasks=upstream_tasks, downstream_tasks=downstream_tasks
            )

    root_task = Task(parent_name)
    flow.set_dependencies(root_task, downstream_tasks=flow.root_tasks())
    if len(flow.tasks) > 2:
        terminal_task = Task(f'{parent_name} [end]')
        flow.set_dependencies(terminal_task, upstream_tasks=flow.terminal_tasks())
    return flow


def set_leaf_flow_dependencies(flow_list, parent_name):
    flow = Flow(parent_name or 'root')
    for flows, upstream_flows, downstream_flows in iterate_ordered_groups(flow_list):
        upstream_tasks = set()
        downstream_tasks = set()
        for upstream_flow in upstream_flows:
            upstream_tasks.update(upstream_flow.terminal_tasks())
        for downstream_flow in downstream_flows:
            downstream_tasks.update(downstream_flow.root_tasks())

        for current_flow in flows:
            for root_task in current_flow.terminal_tasks():
                flow.set_dependencies(root_task, downstream_tasks=downstream_tasks)
            for root_task in current_flow.root_tasks():
                flow.set_dependencies(root_task, upstream_tasks=upstream_tasks)
            flow.update(current_flow)

    root_task = Task(parent_name)
    flow.set_dependencies(root_task, downstream_tasks=flow.root_tasks())
    if parent_name and len(flow.tasks) > 1:
        terminal_task = Task(f'{parent_name} [end]')
        flow.set_dependencies(terminal_task, upstream_tasks=flow.terminal_tasks())
    return flow


def set_parent_task_dependencies(leaf_groups, flow):
    '''Take the mapping from parent group name to a list of Prefect tasks and apply the
    correct priority order across *groups*.
    '''
    input_groups = {**leaf_groups}

    # Collect root tasks separately since they will be merged at the end.
    root_flows = [*input_groups.pop('', [])]
    while input_groups:
        groups = defaultdict(list)
        for group_name, group_flow in input_groups.items():
            # If there is no parent group name then we have reached the root.
            if not group_name:
                root_flows.append(group_flow)
                continue

            flow.update(group_flow)
            parent_name = os.path.dirname(group_name)
            if not parent_name:
                root_flows.append(group_flow)
            else:
                groups[parent_name].append(group_flow)

        # Now that all tasks are collected under common parents, ensure the collected
        # tasks run in the correct priority order.
        input_groups = {}
        for group_name, group_flows in groups.items():
            input_groups[group_name] = set_leaf_flow_dependencies(
                group_flows, group_name
            )

    # Handle all the flows collected at the root.
    disjoint_flow = set_leaf_flow_dependencies(root_flows, flow.name)
    flow.update(disjoint_flow)


def task_trigger(upstream_states):
    # Copy the context over from state to state so that we always have it available
    # later. The prefect global context gets reset every time a taks runs, so it is not
    # suitable for this type of tracking.
    state_context = {}
    for upstream_state in upstream_states.values():
        state_context.update(upstream_state.context)
    for upstream_state in upstream_states.values():
        upstream_state.context.update(state_context)

    # Track if a task that was marked as `abort_fail` has failed. No subsequent task
    # after that task fails can run.
    if state_context.get('abort_fail'):
        raise signals.TRIGGERFAIL(
            '[ABORT_FAIL]: Pipeline cannot continue', context=state_context
        )

    # TODO(stephen): This doesn't work when in backwards comaptibility with zeus.
    task_name = prefect.context.task_name
    if '.require_dir_success' in task_name.lower():
        dirname = os.path.dirname(task_name)
        if state_context.get('directory_failures', {}).get(dirname):
            raise signals.TRIGGERFAIL(
                '[REQUIRE_DIR_SUCCESS]: Cannot run task. Task directory has failures',
                context=state_context,
            )

    # Otherwise, always run a task even if there were previous failures.
    return True


def task_state_handler(task, old_state, new_state):
    # Ensure the state context is passed all the way through the tree.
    new_state.context.update(old_state.context)

    # Custom behavior is only needed if the task that just ran has failed.
    if not new_state.is_failed():
        return

    # TODO(stephen): Should this task just be marked as a reference task?
    if '.abort_fail' in task.name.lower():
        new_state.context['abort_fail'] = True

    # Track directory failures so that any tasks that require the directory to be
    # successful can detect it and fail the task before it runs.
    if 'directory_failures' not in new_state.context:
        new_state.context['directory_failures'] = {}
    dirname = os.path.dirname(task.name)
    new_state.context['directory_failures'][dirname] = True


def add_zeus_failure_features(flow):
    '''Add support for `.abort_fail` and `.require_dir_success` zeus pipeline task flags
    to the Prefect flow.
    '''
    for task in flow.tasks:
        task.state_handlers = [task_state_handler]
        task.trigger = task_trigger


def build_zeus_prefect_task(command, cwd, env, log_file=None):
    full_command = command
    if log_file:
        full_command = f'("{command}" 2>&1) | tee "{log_file}"'

    return ShellTask(
        command=full_command,
        env=env,
        helper_script=f'cd {cwd}',
        log_stdout=True,
        state_handlers=[task_state_handler],
    )


def group_zeus_tasks(zeus_tasks, cwd, backwards_compatible_with_zeus=True):
    '''Create a dictionary mapping a zeus task's parent level to a list of Prefect tasks
    that should run at that level. Update the Prefect flow to apply the correct priority
    running order to the zeus tasks that zeus would have used.
    '''
    groups = defaultdict(list)
    for (script, relative_name, env, log_file) in zeus_tasks:
        parent_name = (
            os.path.dirname(relative_name)
            if not backwards_compatible_with_zeus
            else PipelineUtils.GetTaskPriority(script)
        )
        prefect_task = build_zeus_prefect_task(script, cwd, env, log_file)
        prefect_task.name = relative_name
        groups[parent_name].append(prefect_task)

    output = {}
    for group_name, task_list in groups.items():
        output[group_name] = set_leaf_task_dependencies(task_list, group_name)
    return output


def build_root_task_env():
    '''Build the environment variables that should be applied to all zeus tasks run.'''
    # Pipeline environment variables that are always applied.
    root_pipeline_env_vars = PipelineConfig.Instance().GetAllENVVars()
    python_env_vars = {key: os.getenv(key, '') for key in PYTHON_ENV_VARS}
    return {**root_pipeline_env_vars, **python_env_vars}


def build_prefect_pipeline(pipeline_id, zeus_tasks, cwd):
    flow = Flow(pipeline_id)
    zeus_task_groups = group_zeus_tasks(zeus_tasks, cwd)
    set_parent_task_dependencies(zeus_task_groups, flow)
    add_zeus_failure_features(flow)
    return flow


def create_pipeline(zeus_args):
    '''Build and return a prefect Flow that will run in the same way as a Zeus pipeline.
    '''
    initialize_zeus(zeus_args)
    root_env = build_root_task_env()
    zeus_tasks = get_zeus_tasks(root_env)
    return build_prefect_pipeline(Flags.ARGS.id, zeus_tasks, FileUtils.GetSrcRoot())
