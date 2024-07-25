import subprocess

from pylib.file.file_utils import FileUtils


def translations_import(locale: str, input_file: str) -> None:
    '''This command imports all translations in `filename` and adds the
    translated values to the appropriate i18n.js files.
    1. Open the file at `filename` and validate that there is at least
       an id column and a translation column.
    2. Read in all (id, translated value) pairs.
    3. For each translation, use the id to determine which i18n.js file to add
       the translation to.
    4. Write (id, translated value) to the appropriate i18n.js files.
    '''
    subprocess.run(
        f'node scripts/translations/importer/main.js {locale} {input_file}',
        cwd=FileUtils.GetSrcRoot(),
        shell=True,
        check=True,
    )
