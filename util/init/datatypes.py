# Datatypes to support init / exit handler registration and concurrent execution
import inspect
import time

from pylib.file.file_utils import FileUtils

from log import LOG
from util.thread.task_list import TaskList

_GROUP_COL_SIZE = 20


def _build_func_location(func):
    '''
    Return the repo-relative filename + line number where this function was
    defined.
    '''
    (_, lineno) = inspect.getsourcelines(func)
    filename = FileUtils.FromAbsoluteToRepoRootPath(inspect.getsourcefile(func))
    return f'{filename}:{lineno}'


class Task:
    '''
    A Task object encapsulates the priority and grouping of a function to run
    on init/exit.
    '''

    def __init__(self, groupname, func, priority, required=False):
        self.groupname = groupname
        self.func = func
        self.priority = priority
        self.required = required
        self.location = _build_func_location(func)
        self.duration = -1

    def run_timed(self):
        t0 = time.time()
        self.func()
        t1 = time.time()
        self.duration = t1 - t0

    def summary(self):
        return (
            '{0: >{group_size}} {1: >{priority_size}} {2: >{duration_size}.3f}'
            's {3}'.format(
                self.groupname,
                self.priority,
                self.duration,
                self.location,
                group_size=_GROUP_COL_SIZE,
                priority_size=5,
                duration_size=8,
            )
        )


class TaskGroup:
    '''
    A TaskGroup stores a list of tasks for a single grouping.
    '''

    def __init__(self):
        self.tasks = []

    def add(self, task):
        self.tasks.append(task)

    def required_tasks(self):
        return [t for t in self.tasks if t.required]

    def summary(self):
        return '\n'.join([t.summary() for t in self.tasks if t.duration >= 0])


class TaskRunner:
    '''
    The TaskRunner is used to collect a set of prioritized and grouped
    task definitions to then run them concurrently. Tasks that have the same
    priority will run at the same time.
    '''

    def __init__(self, role):
        self.role = role
        self._map = {}

    def add(self, task):
        '''
        Add a task to the internal priority map.
        '''
        priority = task.priority
        groupname = task.groupname
        if priority not in self._map:
            self._map[priority] = {}
        if groupname not in self._map[priority]:
            self._map[priority][groupname] = TaskGroup()
        self._map[priority][groupname].add(task)

    @staticmethod
    def filter_tasks(task_groups, include, exclude):
        '''
        Filter the stored tasks to include groups that are in the "include" set,
        and remove any groups that are in the "exclude" set. If the include set
        is empty, include all groups. If the exclude set is empty, exclude no
        groups.
        '''
        # Collect the tasks to run
        output = []

        for group in task_groups:
            # TODO: Should we catch when a group exists in both the
            # include and exclude sets?
            if (not include or group.groupname in include) and not (
                exclude and group.groupname in exclude
            ):
                output.extend(group.tasks)
            else:
                # Always add the required tasks even if they match a filter.
                output.extend(group.required_tasks)
        return output

    def run(self, include, exclude):
        '''
        Run the stored tasks concurrently by priority level.
        '''
        if not self._map:
            return

        t0 = time.time()
        with TaskList() as task_list:
            for priority in sorted(self._map.keys()):
                tasks = self.filter_tasks(
                    list(self._map[priority].values()), include, exclude
                )
                funcs_to_run = [t.run_timed for t in tasks]
                task_list.add_all(funcs_to_run)
                task_list.run()
                task_list.wait()

        t1 = time.time()
        self.print_summary((t1 - t0))

    def print_summary(self, duration):
        '''
        Print a nice human readable summary of all the tasks that were run,
        grouped by priority and groupname.
        '''
        lines = [f'{self.role} finished in {duration:.3f}s']
        # Add the group summary header
        lines.append(
            '{0: >{group_width}} Priority  Time  Location'.format(
                'Group', group_width=_GROUP_COL_SIZE
            )
        )

        # Add the summary for all the groups, ordered by priority, grouped by
        # groupname.
        for priority in sorted(self._map.keys()):
            for group in list(self._map[priority].values()):
                group_summary = group.summary()
                # Only include the group's summary if there is anything to
                # report. If the group was skipped completely there will be
                # nothing to log.
                if group_summary:
                    lines.append(group_summary)

        LOG.info('\n'.join(lines))
