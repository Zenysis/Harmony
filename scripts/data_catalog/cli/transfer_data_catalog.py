from typing import Optional
from datetime import datetime
import os
import subprocess

from pylib.base.term_color import TermColor
from pylib.file.file_utils import FileUtils
from log import LOG
from db.postgres.common import get_db_uri, get_local_db_uri
from db.postgres.utils import make_temp_directory


def transfer_data_catalog(
    from_deployment: str,
    to_deployment: Optional[str] = None,
    to_local: Optional[bool] = False,
    disable_migration_check: Optional[bool] = False,
):
    with make_temp_directory() as temp_dir_name:
        str_date = datetime.now().strftime('%Y%m%d%H%M%S')
        filename = f'{from_deployment}_data_catalog_{str_date}.zip'
        output_file = os.path.join(temp_dir_name, filename)

        if to_local:
            deployment_code = os.getenv('ZEN_ENV')
            target_sql_connection_string = get_local_db_uri(deployment_code)
            to_deployment_name = deployment_code
        elif to_deployment:
            target_sql_connection_string = get_db_uri(to_deployment)
            to_deployment_name = to_deployment

        source_sql_connection_string = get_db_uri(from_deployment)

        export_script_path = FileUtils.GetAbsPathForFile(
            'scripts/data_catalog/export_db_tables.py'
        )
        print(
            TermColor.ColorStr(f"Exporting {from_deployment}'s data catalog", 'YELLOW')
        )
        subprocess.call(
            [
                'python',
                export_script_path,
                '--sql_connection_string',
                source_sql_connection_string,
                '--output_file',
                output_file,
            ]
        )

        print(
            TermColor.ColorStr(
                f"Importing data catalog into {to_deployment_name}",
                'YELLOW',
            )
        )

        import_script_path = FileUtils.GetAbsPathForFile(
            'scripts/data_catalog/import_db_tables.py'
        )
        import_cmd = [
            'python',
            import_script_path,
            '--sql_connection_string',
            target_sql_connection_string,
            '--input_file',
            output_file,
        ]
        if disable_migration_check:
            import_cmd.append('--disable_migration_check')
        proc = subprocess.Popen(import_cmd)
        # timeout the process in 2 minutes
        (_, stderr) = proc.communicate(timeout=120)
        if proc.returncode != 0:
            LOG.error(stderr)
            print(TermColor.ColorStr("Importing of data catalog failed", 'RED'))
        else:
            print(
                TermColor.ColorStr(
                    f'Data catalog successfully imported into {to_deployment_name}',
                    'GREEN',
                )
            )
