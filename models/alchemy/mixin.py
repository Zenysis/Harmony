import sqlalchemy as sa
from sqlalchemy.types import DateTime
from sqlalchemy.sql import expression
from sqlalchemy.ext.compiler import compiles


class utcnow(
    expression.FunctionElement
):  # pylint: disable=invalid-name,too-many-ancestors
    type = DateTime()
    inherit_cache = True


@compiles(utcnow, 'postgresql')
def pg_utcnow(element, compiler, **kw):  # pylint: disable=unused-argument
    return "TIMEZONE('utc', CURRENT_TIMESTAMP)"


@compiles(utcnow, 'mssql')
def ms_utcnow(element, compiler, **kw):  # pylint: disable=unused-argument
    return "GETUTCDATE()"


class UTCTimestampMixin:
    '''
    A mixin for keeping track of modification/creation times for records in a table
    using UTC timestamp
    '''

    __mapper_args__ = {"order_by": "last_modified"}

    '''
        The UTC timestamp when the record was created.
    '''
    created = sa.Column(DateTime, nullable=False, server_default=utcnow())

    '''
        The UTC timestamp when the record was last updated.
    '''
    last_modified = sa.Column(
        DateTime, nullable=False, server_default=utcnow(), onupdate=utcnow()
    )


class LastModifiedMixin:
    '''A mixin for keeping track of modification/creation times for records in a table'''

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
