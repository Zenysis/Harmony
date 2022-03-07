import typing

# NOTE(stephen): Avoid circular dependency.
if typing.TYPE_CHECKING:
    from db.druid.query_builder import GroupByQueryBuilder


def optimize_granularity(query: 'GroupByQueryBuilder') -> None:
    '''If an arbitrary granularity is selected and there is only one interval to bucket
    the query by, then we can convert the granularity into an ALL granularity type and
    set the query interval to match the granularity bucket.
    '''
    granularity = query.granularity
    if (
        isinstance(granularity, dict)
        and granularity['type'] == 'arbitrary'
        and len(granularity['intervals']) == 1
    ):
        query.intervals[0] = granularity['intervals'][0]
        query.granularity = 'all'


def apply_basic_optimizations(query: 'GroupByQueryBuilder') -> None:
    optimize_granularity(query)
