from data.feed.seed_updates import set_feed_update_enum_types
from . import get_session
from web.server.data.data_access import Transaction


def upvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        set_feed_update_enum_types(transaction)
