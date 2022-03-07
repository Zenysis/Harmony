from builtins import object
from concurrent import futures

def run_tasks(tasks, thread_pool=None):
    '''
    Run each task in the list of tasks. If a thread pool is provided, execute
    the tasks in the thread pool and return their Futures.
    '''
    if not thread_pool:
        _ = [t() for t in tasks]
        return []
    return [thread_pool.submit(t) for t in tasks]

class TaskList(object):
    '''
    Simple task runner for executing multiple tasks concurrently or in series.
    For now, the return value of the run tasks is ignored.

    NOTE(stephen): If this class is useful, expand it to allow return value
    capture.
    '''
    def __init__(self, tasks=None, asynchronous=True, max_workers=None):
        self._pool = None
        self._tasks = []
        self._running_tasks = []
        self._asynchronous = asynchronous
        self._max_workers = max_workers
        if tasks:
            self.add_all(tasks)

    def __enter__(self):
        if self._asynchronous:
            # Initialize a thread pool if we are in async mode
            self._pool = futures.ThreadPoolExecutor(
                max_workers=self._max_workers)
        return self

    def __exit__(self, exception_type, exception_value, exception_traceback):
        if self._pool:
            self._pool.__exit__(exception_type, exception_value,
                                exception_traceback)

    def add(self, func):
        '''
        Add a new function to the task list to run.
        '''
        assert not self._running_tasks, \
            'Cannot add new task when execution is in progress.'
        self._tasks.append(func)

    def add_all(self, tasks):
        '''
        Add a list of functions to the task list.
        '''
        _ = [self.add(t) for t in tasks]

    def run(self):
        '''
        Run the current set of tasks.
        '''
        # If the tasks are currently being run, do nothing.
        if self._running_tasks:
            return

        # Execute all the tasks and collect any Future instances to wait on.
        self._running_tasks = run_tasks(self._tasks, self._pool)

        # Clear the list of tasks that need to be run.
        self._tasks = []

    def wait(self):
        '''
        Wait for all the tasks to complete.
        '''
        if self._running_tasks:
            for task in futures.as_completed(self._running_tasks):
                # Access the task's result so that any exceptions raised will
                # be surfaced here.
                _ = task.result()

            # Reset the list of running tasks since we have successfully waited
            # for them to all execute.
            self._running_tasks = []
