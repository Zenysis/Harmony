import os

# NOTE(stephen): We need access to the werkzeug reloader internals so that we can
# effectively subclass and register our custom reloader.
from werkzeug import _reloader
from pylib.file.file_utils import FileUtils

ZENYSIS_SRC_ROOT = FileUtils.GetSrcRoot()

# Tuple of directories we know will never have python modules imported by the web
# server.
DIRECTORIES_TO_IGNORE = (
    os.path.join(ZENYSIS_SRC_ROOT, 'node_modules'),
    os.path.join(ZENYSIS_SRC_ROOT, 'open_source'),
    os.path.join(ZENYSIS_SRC_ROOT, 'pipeline'),
    os.path.join(ZENYSIS_SRC_ROOT, 'venv_pypy3'),
    os.path.join(ZENYSIS_SRC_ROOT, '.hotfix_worktree'),
)


class DevWatchdogReloader(_reloader.reloader_loops['watchdog']):
    '''A customized reloader that can exclude certain directories from triggering a
    reload.
    '''

    def trigger_reload(self, filename):
        if not filename.startswith(DIRECTORIES_TO_IGNORE):
            super().trigger_reload(filename)


# HACK(stephen): The werkzeug reloaders are referenced by name in `app.run()`, so we
# register our class as a new reloader_loop type.
_reloader.reloader_loops['zenysis_watchdog'] = DevWatchdogReloader
