from typing import List
import subprocess
from pylib.file.file_utils import FileUtils


def get_translation_files(exclude_root: bool = False) -> List[str]:
    '''Get a list of all files in web/client with the filename `i18n.js`.

    Args:
        exclude_root: if true, exclude top-level `/web/client/i18n.js`

    Returns:
        List[str]
    '''
    root_dir = f'{FileUtils.GetSrcRoot()}/web/client'
    find_args = ['find', root_dir, '-name', 'i18n.js']

    if exclude_root:
        find_args += ['-not', '-path', f'{root_dir}/i18n.js']

    results: str = (
        subprocess.Popen(find_args, stdout=subprocess.PIPE)
        .communicate()[0]
        .decode('utf-8')
    )
    return results.splitlines()
