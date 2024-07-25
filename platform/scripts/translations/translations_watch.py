import subprocess
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
