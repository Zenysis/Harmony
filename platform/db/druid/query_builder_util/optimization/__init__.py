import typing

from .basic_optimizations import apply_basic_optimizations
from .filter_optimizations import apply_filter_optimizations
from .sketch_optimizations import apply_sketch_optimizations

if typing.TYPE_CHECKING:
    from db.druid.query_builder import GroupByQueryBuilder


def apply_optimizations(query: 'GroupByQueryBuilder') -> None:
    '''Apply optimizations to the current query, modifying it *in-place*. These
    optimizations are guaranteed to result in an equivalent query result (all fields
    being queried will have the same output value in both the unoptimized and optimized
    query form).
    '''
    apply_basic_optimizations(query)
    apply_filter_optimizations(query)
    apply_sketch_optimizations(query)
