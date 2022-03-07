import related

from data.query.models.query_filter import QueryFilter
from util.related.polymorphic_model import build_polymorphic_base

SUM_METRIC = 'sum'
COUNT_METRIC = 'count'

# TODO(david): fix type error
@related.immutable
class Calculation(build_polymorphic_base()):  # type: ignore[misc]
    '''A Calculation encapsulates all the pieces necessary to produce a value from the
    database.
    '''

    # As rows are streamed through the calculation in the database, the query
    # filter determines whether the row's value should be included in the
    # calculation.
    filter = QueryFilter.child_field(required=False)

    def to_druid(self, result_id):  # pylint: disable=no-self-use,unused-argument
        raise ValueError('to_druid must be implemented by subclass.')
