from typing import List
import subprocess
from pylib.file.file_utils import FileUtils


def get_i18n_files() -> List[str]:
    '''Get a list of all files in web/client that have `import I18N` in them.

    Returns:
        List[str]
    '''
    results: str = (
        subprocess.Popen(
            [
                'grep',
                '-rwl',
                '--include',
                '*.js',
                '--include',
                '*.jsx',
                '--exclude',
                'i18n.js',
                '-e',
                'import I18N',
                '%s/web/client' % FileUtils.GetSrcRoot(),
            ],
            stdout=subprocess.PIPE,
        )
        .communicate()[0]
        .decode('utf-8')
    )
    return results.splitlines()


def translations_generate(verbose: bool = True) -> None:
    '''This command generates all necessary i18n.js files. It will:
    1. Find all files that use the I18N component
    2. Generate a list of all translations found in all those files
    3. Generate co-located i18n.js (one per directory), filled with all
        the translations we found
    4. If an i18n.js file already exists, it will merge in any new translations
    5. Remove all unused translations
    '''
    print('Scanning files...')
    filenames = get_i18n_files()

    num_files = len(filenames)
    pluralized_file = 'file' if num_files == 1 else 'files'
    print(f'Found {num_files} {pluralized_file} that import I18N')

    files_arg = "'%s'" % ("' '".join(filenames))
    verbose_arg = '--verbose' if verbose else ''
    subprocess.run(
        f'node scripts/translations/generator/main.js {verbose_arg} {files_arg}',
        cwd=FileUtils.GetSrcRoot(),
        shell=True,
        check=True,
    )
