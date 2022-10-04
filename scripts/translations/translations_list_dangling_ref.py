import subprocess
from pylib.file.file_utils import FileUtils
from scripts.translations.translations_util import get_translation_files


def translations_list_dangling_ref() -> None:
    '''This command lists all translation references that do not reference an
       existing translation.
    1. Find all directory-level i18n.js files and generate a list of all
       translation ids inside the project.
    2. Collect a list of all translation references in the project.
    3. Confirm each translation reference matches an existing translation id.
    '''
    print('Scanning files...')
    filenames = get_translation_files(True)

    num_files = len(filenames)
    pluralized_file = 'file' if num_files == 1 else 'files'
    print(f'Found {num_files} directory-level i18n.js {pluralized_file}')

    files_arg = "'%s'" % ("' '".join(filenames))

    subprocess.run(
        f'node scripts/translations/referencer/main.js {files_arg}',
        cwd=FileUtils.GetSrcRoot(),
        shell=True,
        check=True,
    )
