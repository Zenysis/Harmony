#!/usr/bin/env python
from builtins import range, object
import sys

from datetime import datetime
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

from config.aggregation import GEO_FIELD_ORDERING
from config.database import POSTGRES_CONFIG
from data.pipeline.datatypes import explorer_models
from db.postgres.connection import PostgresConnection
from pylib.base.flags import Flags


class ExplorerDatabaseBuilder(object):
    def __init__(self, conn, cursor, dbname):
        self.conn = conn
        self.cursor = cursor
        self.dbname = dbname

    def create_new_db(self):
        ''' Creates the database coresponding to the most recent pieline run.
        '''
        q = self.cursor.mogrify('CREATE DATABASE %s' % self.dbname)
        self.cursor.execute(q)
        self.conn.commit()

    def db_exists(self):
        '''Checks if the database already exsits. If it does the pipeline
        was already run today.
        '''
        q = (
            "select exists(SELECT datname FROM pg_catalog.pg_database \
                           WHERE lower(datname) = lower('%s'));"
            % self.dbname
        )
        self.cursor.execute(q)
        return self.cursor.fetchone()[0]

    def initialize_db(self):
        '''Create the database if it does not already exist.
        '''
        if not self.db_exists():
            self.create_new_db()
        else:
            print('Database %s already exists.' % self.dbname)

    def drop_db_tables(self):
        # If the database had already been created, drop the explorer tables
        # so they can be rebuilt
        _ = [self.maybe_drop_table(t) for t in explorer_models.TABLE_NAMES]

    def maybe_drop_table(self, table_name):
        '''If the pipeline was run today already, drop the database it created
        and make a new one.
        '''
        q = self.cursor.mogrify('DROP TABLE IF EXISTS %s CASCADE;' % table_name)
        self.cursor.execute(q)
        self.conn.commit()

    def insert_location_types(self, table_name, hierarchy):
        ''' Fill the location types table in postgres. Will only have 4 entries
        for et_moh. TODO(moriah): move this elsewhere, so that location_types is
        filled the same way as all the other tables.
        '''
        for i in range(0, len(hierarchy)):
            q = self.cursor.mogrify(
                'INSERT INTO %s (id, name) VALUES %s;' % (table_name, (i, hierarchy[i]))
            )
            self.cursor.execute(q)
            self.conn.commit()

    def change_connection(self, conn):
        self.conn = conn
        self.cursor = conn.cursor()

    def write_dbname(self, dbname_file):
        ''' Write the new databases name to a file so that the rest of indexing know
        where to write'''
        with open(dbname_file, 'w') as database_file:
            database_file.write(self.dbname)


def main():
    Flags.PARSER.add_argument(
        '--dbname_prefix', type=str, required=True, help='Prefix of new database names'
    )
    Flags.PARSER.add_argument(
        '--output_dbname_path',
        type=str,
        required=True,
        help='Path for new database name',
    )
    Flags.InitArgs()

    conn = PostgresConnection.create_psycopg2(POSTGRES_CONFIG, 'explorer')
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    dbname = '%s_%s' % (
        Flags.ARGS.dbname_prefix,
        datetime.now().strftime('%Y%m%d_%H%M%S'),
    )

    explorer_builder = ExplorerDatabaseBuilder(conn, conn.cursor(), dbname)
    explorer_builder.initialize_db()
    explorer_builder.write_dbname(Flags.ARGS.output_dbname_path)

    # Once the new db is created, switch the psycopg connection to the new database
    conn.close()
    conn = PostgresConnection.create_psycopg2(POSTGRES_CONFIG, dbname)

    engine = PostgresConnection.create_sqlalchemy(POSTGRES_CONFIG, dbname)

    explorer_builder.change_connection(conn)
    explorer_builder.drop_db_tables()
    explorer_models.create_tables(engine)
    explorer_builder.insert_location_types(
        explorer_models.LOCATION_TYPES_NAME, GEO_FIELD_ORDERING
    )


if __name__ == '__main__':
    sys.exit(main())
