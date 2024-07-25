import subprocess
from pylib.file.file_utils import FileUtils
from scripts.translations.translations_util import get_translation_files


def translations_list_dangling(base_locale: str = 'en') -> None:
    '''This command lists all existing i18n.js files that contain dangling
    translations. It will:
    1. Find all directory-level i18n.js files.
    2. For each file, check that every non-base translation id has a
       counterpart id in the base translation.
    3. Print unmatched ids.
    '''
    print('Scanning files...')
    filenames = get_translation_files(True)

    num_files = len(filenames)
    pluralized_file = 'file' if num_files == 1 else 'files'
    print(f'Found {num_files} directory-level i18n.js {pluralized_file}')

    files_arg = "'%s'" % ("' '".join(filenames))

    subprocess.run(
        f'node scripts/translations/synchronizer/danglingMain.js {base_locale} {files_arg}',
        cwd=FileUtils.GetSrcRoot(),
        shell=True,
        check=True,
    )
