from builtins import object
import sqlalchemy as sa
from sqlalchemy.types import DateTime


class LastModifiedMixin(object):
    '''A mixin for keeping track of modification/creation times for records in a table
    '''

    __mapper_args__ = {"order_by": "last_modified"}

    '''
    The time when the record was created.
    '''
    created = sa.Column(DateTime, nullable=False, server_default=sa.func.now())

    '''
    The time when the record was last updated.
    '''
    last_modified = sa.Column(
        DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()
    )
