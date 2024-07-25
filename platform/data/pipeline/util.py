# mypy: disallow_untyped_defs=True
import os
from typing import Tuple, Union


def list_files_in_dir(
    directory: str, prefix: Union[str, Tuple] = "", suffix: Union[str, Tuple] = ""
) -> list:
    '''This function returns a list of files in a directory


    args
    -------
    directory: Directory whose files to list
    prefix: pattern the files to list should start with
    suffix: pattern the files to list should end with
    '''
    return list(
        filter(
            lambda filename: filename.endswith(suffix) and filename.startswith(prefix),
            os.listdir(directory),
        )
    )
