#!/usr/bin/env python
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm.session import sessionmaker
from pylib.base.flags import Flags

from log import LOG

from models.alchemy.query import UnpublishedField
from web.server.data.data_access import Transaction


def get_session(sql_connection_string):
    # pylint: disable=invalid-name
    Session = sessionmaker()
    engine = create_engine(sql_connection_string)
    Session.configure(bind=engine)
    session = Session()
    return session


DUMMY_DATA = [
    {
        'id': 'test_unpublished_field_1',
        'calculation': {
            "type": "SUM",
            "filter": {"type": "FIELD", "fieldId": "test_unpublished_field_1"},
        },
    },
    {
        'id': 'test_unpublished_field_2',
        'calculation': {
            "type": "SUM",
            "filter": {"type": "FIELD", "fieldId": "test_unpublished_field_2"},
        },
    },
    {
        'id': 'test_unpublished_field_3',
        'calculation': {
            "type": "SUM",
            "filter": {"type": "FIELD", "fieldId": "test_unpublished_field_3"},
        },
    },
    {
        'id': 'test_unpublished_field_4',
        'calculation': {
            "type": "SUM",
            "filter": {"type": "FIELD", "fieldId": "test_unpublished_field_4"},
        },
    },
    {
        'id': 'test_unpublished_field_5',
        'calculation': {
            "type": "SUM",
            "filter": {"type": "FIELD", "fieldId": "test_unpublished_field_5"},
        },
    },
    {
        'id': 'test_unpublished_field_6',
        'calculation': {
            "type": "SUM",
            "filter": {"type": "FIELD", "fieldId": "test_unpublished_field_6"},
        },
    },
    {
        'id': 'test_unpublished_field_7',
        'calculation': {
            "type": "SUM",
            "filter": {"type": "FIELD", "fieldId": "test_unpublished_field_7"},
        },
    },
    {
        'id': 'test_unpublished_field_8',
        'calculation': {
            "type": "SUM",
            "filter": {"type": "FIELD", "fieldId": "test_unpublished_field_8"},
        },
    },
    {
        'id': 'test_unpublished_field_9',
        'calculation': {
            "type": "SUM",
            "filter": {"type": "FIELD", "fieldId": "test_unpublished_field_9"},
        },
    },
    {
        'id': 'test_unpublished_field_10',
        'calculation': {
            "type": "SUM",
            "filter": {"type": "FIELD", "fieldId": "test_unpublished_field_10"},
        },
    },
    {
        'id': 'test_unpublished_field_11',
        'calculation': {
            "type": "SUM",
            "filter": {"type": "FIELD", "fieldId": "test_unpublished_field_11"},
        },
    },
    {
        'id': 'test_unpublished_field_12',
        'calculation': {
            "type": "SUM",
            "filter": {"type": "FIELD", "fieldId": "test_unpublished_field_12"},
        },
    },
    {
        'id': 'test_unpublished_field_13',
        'calculation': {
            "type": "SUM",
            "filter": {"type": "FIELD", "fieldId": "test_unpublished_field_13"},
        },
    },
    {
        'id': 'test_unpublished_field_14',
        'calculation': {
            "type": "SUM",
            "filter": {"type": "FIELD", "fieldId": "test_unpublished_field_14"},
        },
    },
    {
        'id': 'test_unpublished_field_15',
        'calculation': {
            "type": "SUM",
            "filter": {"type": "FIELD", "fieldId": "test_unpublished_field_15"},
        },
    },
    {
        'id': 'test_unpublished_field_16',
        'calculation': {
            "type": "SUM",
            "filter": {"type": "FIELD", "fieldId": "test_unpublished_field_16"},
        },
    },
]


def populate_dummy_data(transaction):
    '''Populates UnpublishedField table with dummy data
    '''
    for obj in DUMMY_DATA:
        transaction.add_or_update(
            UnpublishedField(id=obj['id'], calculation=obj['calculation'])
        )


def main():
    '''Populates unpublished_field dummy data.

    To run locally:
        ./scripts/field_setup/populate_unpublished_field_dummy_data.py
    '''
    Flags.PARSER.add_argument(
        '-d',
        '--sql_connection_string',
        type=str,
        required=False,
        help='The SQL Connection String to use to connect to the SQL '
        'Database. Can also be specified via the \'DATABASE_URL\' '
        'environment variable. The inline parameter takes priority'
        'over the environment variable.',
    )
    Flags.InitArgs()

    LOG.info('Begin populating...')

    with Transaction(
        get_session=lambda: get_session(Flags.ARGS.sql_connection_string)
    ) as transaction:
        populate_dummy_data(transaction)


if __name__ == '__main__':
    sys.exit(main())
