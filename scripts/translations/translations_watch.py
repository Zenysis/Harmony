import subprocess
import time
from pylib.base.term_color import TermColor
from pylib.file.file_utils import FileUtils
from scripts.translations.translations_generate import translations_generate

I18N_ROOT = 'web/client'
SRC_ROOT = FileUtils.GetSrcRoot()
TRANSLATIONS_MAIN = FileUtils.GetAbsPathForFile('scripts/translations/watcher/main.js')


def translations_watch(verbose: bool = False) -> None:
    '''This command starts a watchman server that will send a filepath to the
    watcher script every time a file changes. The watcher script will handle
    generating translations for the modified file.
    '''
    print(TermColor.ColorStr('Starting translations watch server...', 'YELLOW'))
    verbose_arg = '--verbose' if verbose else ''

    # On some platforms, running watchman-wait will fail with a timeout. The workaround
    # for this is to ensure that the watchman server is running before starting.
    subprocess.run(
        'watchman --output-encoding=bser get-sockname',
        shell=True,
        check=True,
        stdout=subprocess.DEVNULL,
    )
    # We also need to give watchman some time to get started...
    time.sleep(1)

    # first, generate all translations to make sure we are up-to-date
    translations_generate(verbose)

    # now start up the watchman server to detect any new changes
    subprocess.run(
        f"watchman-wait {SRC_ROOT} -p '{I18N_ROOT}/**/*.js' '{I18N_ROOT}/**/*.jsx' "
        f'--max-events 0 | node {TRANSLATIONS_MAIN} {SRC_ROOT} {verbose_arg}',
        cwd=SRC_ROOT,
        shell=True,
        check=True,
    )
