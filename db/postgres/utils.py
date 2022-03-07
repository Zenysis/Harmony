import csv
import re
import urllib.parse
import shutil
import tempfile
from typing import List, Optional
import zipfile
from contextlib import contextmanager
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT, quote_ident

from log import LOG
from util.file.compression.lz4 import LZ4Writer, LZ4Reader

# NOTE(solo): This postgres function when executed. It checks if a table
# has an id sequence and if it does then it sets the next sequence value
# to be the maximum value in the table plus 1
SET_SEQUENCE_SQL = '''
do $$
declare
   id_seq varchar;
   result varchar;
begin
     SELECT pg_get_serial_sequence('{table_name}', 'id') INTO id_seq;

     if id_seq is NOT NULL then
        SELECT setval(pg_get_serial_sequence('{table_name}', 'id'), coalesce(max(id),0) + 1, false) FROM {table_name} INTO result;
     end if;
end $$
'''


class ImportTableDataError(Exception):
    def __init__(self, message):
        super().__init__()
        self.message = message

    def as_dict(self):
        dct = {'$message': self.message}
        return dct

    def __str__(self) -> str:
        return self.message


def url_encode(sql_connection_string: str):
    matches = re.findall(r'\/\/(.*)@', sql_connection_string)
    if matches:
        password_username = matches[0]
        sql_connection_string = sql_connection_string.replace(
            password_username, urllib.parse.quote(password_username, safe=':')
        )
    return sql_connection_string


@contextmanager
def psycopg_connection(*args, **kwargs):
    try:
        conn = psycopg2.connect(*args, **kwargs)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        yield conn
    finally:
        # We must always try to close the connection when the user is finished with it.
        conn.close()


@contextmanager
def make_temp_directory():
    temp_dir = tempfile.mkdtemp()
    try:
        yield temp_dir
    finally:
        shutil.rmtree(temp_dir)


def export_tables_to_zip(
    tables: List[str],
    output_filename: str,
    sql_connection_string: str,
    delimiter: str = ';',
):
    '''exports database tables specified into csv files in zipped file.
    Args:
        tables: List of all tables to export
    '''
    with psycopg_connection(sql_connection_string) as conn, zipfile.ZipFile(
        output_filename, 'w', zipfile.ZIP_DEFLATED, compresslevel=3
    ) as zip_file, make_temp_directory() as temp_dir_name:
        cursor = conn.cursor()
        for table in tables:
            LOG.info('Beginning export of table: %s', table)

            # Quote the table name to prevent SQL injection.
            table_ident = quote_ident(table, conn)

            # Since we have to execute the COPY statement as raw SQL, we need to safely
            # escape all untrusted input.
            sql_command = cursor.mogrify(
                f'COPY {table_ident} TO STDOUT WITH CSV DELIMITER %s HEADER',
                (delimiter,),
            )

            file_name = f'{temp_dir_name}/output.csv.lz4'
            with LZ4Writer(file_name) as f:
                cursor.copy_expert(sql_command, f)

            zip_file.write(
                file_name,
                f'{table}.csv.lz4',
                compress_type=zipfile.ZIP_DEFLATED,
                compresslevel=3,
            )
            LOG.info('Finished export of table: %s', table)


def get_current_db_version(cursor):
    cursor.execute('SELECT version_num FROM alembic_version')
    row = cursor.fetchone()
    if row:
        return row[0]
    return None


def check_db_migration_version(version_file, current_db_version, delimiter):
    if not current_db_version:
        LOG.info(
            'Could not determine current migration version of the database,'
            'blindly importing data into the tables.'
        )
        return
    with LZ4Reader(version_file) as reader:
        csv_reader = csv.DictReader(reader, delimiter=delimiter)
        row = next(csv_reader)
        file_db_version = row.get('version_num')

        if not file_db_version:
            LOG.error(
                'Could not determine the db migration version number in the imported archive'
            )

        if not file_db_version or file_db_version.strip() != current_db_version:
            raise ImportTableDataError(
                'Current database migration version differs from version in the '
                'export archives and cannot import data into the tables. '
                'If you are confident that none of the migrations will adversely '
                'affect this transfer, then use the disable_migration_check param '
                'to override this check.'
            )


def import_data_into_table(
    sql_connection_string,
    input_file,
    tables: List[str],
    delimiter: str = ';',
    disable_migration_check: Optional[bool] = False,
):
    '''imports data into the tables from a csv file
    Args:
        sql_connection_string: Postgres database connection string,
        input_file: Path to the zipped file
        csv_data (file): CSV file object descriptor.
        delimiter (str): CSV data delimeter
    '''
    with psycopg_connection(sql_connection_string) as conn, zipfile.ZipFile(
        input_file
    ) as zip_file, make_temp_directory() as temp_dir_name:
        version_file = zip_file.extract('alembic_version.csv.lz4', path=temp_dir_name)
        with conn.cursor() as cursor:
            if not disable_migration_check:
                current_db_version = get_current_db_version(cursor)
                check_db_migration_version(version_file, current_db_version, delimiter)
            for table_name in tables:
                LOG.info('Beginning import of data into table: %s', table_name)
                file_name = zip_file.extract(
                    f'{table_name}.csv.lz4', path=temp_dir_name
                )

                # Quote the table name to prevent SQL injection.
                table_ident = quote_ident(table_name, conn)

                # Since we have to execute the COPY statement as raw SQL, we need to safely
                # escape all untrusted input.
                copy_from_sql = cursor.mogrify(
                    f'COPY {table_ident} FROM STDIN WITH CSV DELIMITER %s HEADER',
                    (delimiter,),
                )

                with LZ4Reader(file_name) as reader:
                    cursor.execute(
                        f'TRUNCATE TABLE {table_ident} RESTART IDENTITY CASCADE;'
                    )
                    cursor.copy_expert(copy_from_sql, reader)
                    # execute sql to reset the sequence if table has sequence
                    cursor.execute(SET_SEQUENCE_SQL.format(table_name=table_ident))
                LOG.info('Finished import of data into table: %s', table_name)
