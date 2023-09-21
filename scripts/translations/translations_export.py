import subprocess
from pylib.file.file_utils import FileUtils
from scripts.translations.translations_util import get_translation_files


def translations_export(
    locale: str, out: str, missing: bool, out_of_sync: bool
) -> None:
    '''This command exports all translations of a given `locale` to
    a specified output CSV.
    1. Find all i18n.js files
    2. Collect all 'en' translations
    3. Collect all translations for the given `locale`
    4. Add all translations to a CSV
    '''
    print('Scanning files...')
    filenames = get_translation_files()

    num_files = len(filenames)
    pluralized_file = 'file' if num_files == 1 else 'files'
    print(f'Found {num_files} i18n.js {pluralized_file}')

    args = [
        '--missing' if missing else '',
        '--out_of_sync' if out_of_sync else '',
        locale,
        out,
        *(f"'{f}'" for f in filenames),
    ]
    args_str = ' '.join(args)

    subprocess.run(
        f'node scripts/translations/exporter/main.js {args_str}',
        cwd=FileUtils.GetSrcRoot(),
        shell=True,
        check=True,
    )
