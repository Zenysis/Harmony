#!/usr/bin/env python
# Script for migrating data from SQLite to Postgres

import os
import sys

# pylint:disable=
from pylib.base.flags import Flags
from sqlalchemy import create_engine
from sqlalchemy.orm import class_mapper, sessionmaker

from log import LOG
from models.alchemy.configuration import Configuration
from models.alchemy.dashboard import Dashboard
from models.alchemy.security_group import Group, GroupRoles, GroupUsers
from models.alchemy.permission import (
    Permission,
    Resource,
    ResourceType,
    Role,
    RolePermissions,
)
from models.alchemy.user import DefaultRoles, User, UserRoles
from web.server.configuration.flask import DEFAULT_DB_URI
from web.server.data.data_access import Transaction
from web.server.util.util import as_dictionary

# Models will be inserted in the order specified here
# We have to do it in THIS SPECIFIC order because of
# ForeignKey constraints
MODEL_TYPES = [
    # Inserting Permission Models
    ResourceType,
    Resource,
    Permission,
    Role,
    RolePermissions,
    # Inserting User Models
    User,
    UserRoles,
    DefaultRoles,
    # Inserting Group Models
    Group,
    GroupRoles,
    GroupUsers,
    # Configuration and Group Models Last
    Configuration,
    Dashboard,
]

# The command that is executed after a bulk insert on a table to ensure that
# the next insert on the table will not cause a conflict if a primary key
# value is not specified.
# For details, see: https://til.codes/dont-forget-to-update-the-sequence-in-postgresql-after-a-copy-command/
RESET_SEQUENECE_COMMAND_FORMAT = '''
SELECT setval((SELECT pg_get_serial_sequence('{table_name}', '{id_column}')),
(SELECT COALESCE(MAX({id_column}), 0) FROM public.{table_name}) + 1);
'''


def _build_should_commit(commit_changes):
    def should_commit(exception_type, exception_value, exception_traceback):
        if exception_type or exception_value or exception_traceback:

            addendum = 'Fix the error and re-run the tool. '

            if commit_changes:
                addendum = (
                    'Changes will NOT be written to the database until all errors are '
                    'resolved.'
                )

            LOG.error(
                'The following exception was encountered during data migration: %s. '
                'Callstack was: %s.%s',
                exception_value,
                exception_traceback,
                addendum,
            )
            return False

        if commit_changes:
            LOG.info('Changes were successful and will be written to disk. ')
        else:
            LOG.info(
                'This is only a dry run. No data integrity errors were encountered while '
                'testing data migration. Re-run the tool with the \'-w\' or '
                '\'--commit_changes\' flag to persist changes in PostgreSQL.'
            )

        return commit_changes

    return should_commit


def build_session_factory(database_uri):
    # I prefer to use the Pythonic class-naming convention
    # pylint:disable=C0103
    Session = sessionmaker()
    db_engine = create_engine(database_uri)
    Session.configure(bind=db_engine)
    return Session


def insert_data(sqlite_transaction, postgres_transaction):
    for model_type in MODEL_TYPES:
        sqlite_models = sqlite_transaction.find_all_by_fields(model_type, {})
        for sqlite_model in sqlite_models:
            model_dictionary = as_dictionary(sqlite_model)
            entity = postgres_transaction.find_one_by_fields(
                model_type, True, model_dictionary
            )

            if entity:
                LOG.debug(
                    'Entity of type \'%s\' with values \'%s\' already exists in PostgreSQL. ',
                    model_type,
                    model_dictionary,
                )
            else:
                postgres_model = model_type(**model_dictionary)
                postgres_transaction.add_or_update(postgres_model)
                LOG.debug(
                    'Staged entity of type \'%s\' with values \'%s\' for creation. ',
                    model_type,
                    model_dictionary,
                )

    for model_type in MODEL_TYPES:
        mapper = class_mapper(model_type)
        table_name = mapper.local_table

        if len(mapper.primary_key) > 1:
            LOG.info(
                'Cannot update primary key sequence for table \'%s\' as '
                'it has a composite primary key. ',
                table_name,
            )
        else:
            id_column = class_mapper(model_type).primary_key[0].name
            reset_sequence_id_command = RESET_SEQUENECE_COMMAND_FORMAT.format(
                table_name=table_name, id_column=id_column
            )

            postgres_transaction.run_raw().execute(reset_sequence_id_command)
            LOG.info(
                'Successfully staged updated primary key sequence for ' 'table \'%s\'',
                table_name,
            )


def main():
    Flags.PARSER.add_argument(
        '-s',
        '--sqlite_uri',
        type=str,
        required=False,
        help='The URI of the SQLite Database that data will be read from.',
        default=DEFAULT_DB_URI,
    )
    Flags.PARSER.add_argument(
        '-p',
        '--postgres_uri',
        type=str,
        required=True,
        help='The URI of the PostgreSQL Database that data will be written ' 'to.',
    )
    Flags.PARSER.add_argument(
        '-w',
        '--commit_changes',
        action='store_true',
        required=False,
        default=False,
        help='Commit all changes to the PostgreSQL Database. By default this '
        'tool runs in dry-run mode and only lists the changes that will '
        'be made.',
    )
    Flags.InitArgs()

    running_in_production = os.getenv('ZEN_PROD', None)
    if running_in_production:
        LOG.error(
            'This script must be run manually and cannot be run when \'ZEN_PROD\' is set. '
        )
        return 1

    sqlite_uri = Flags.ARGS.sqlite_uri
    postgres_uri = Flags.ARGS.postgres_uri
    commit_changes = Flags.ARGS.commit_changes

    # I prefer to use the Pythonic class-naming convention
    # pylint:disable=C0103
    SQLiteSession = build_session_factory(sqlite_uri)
    LOG.info('Established a connection to the SQLite database (\'%s\'). ', sqlite_uri)

    PostgresSession = build_session_factory(postgres_uri)
    LOG.info(
        'Established a connection to the PostgreSQL database (\'%s\'). ', postgres_uri
    )

    with Transaction(get_session=SQLiteSession) as sqlite_transaction, Transaction(
        should_commit=_build_should_commit(commit_changes), get_session=PostgresSession
    ) as postgres_transaction:

        insert_data(sqlite_transaction, postgres_transaction)

    return 0


if __name__ == '__main__':
    sys.exit(main())
