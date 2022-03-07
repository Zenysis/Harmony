# pylint: disable=too-many-branches,too-many-return-statements
from typing import List, Optional, TYPE_CHECKING

from pydruid.utils.filters import Filter

from db.druid.util import EmptyFilter

# NOTE(stephen): Avoid circular dependency.
if TYPE_CHECKING:
    from db.druid.query_builder import GroupByQueryBuilder


def get_filter_type(druid_filter: Filter) -> str:
    raw_filter = druid_filter.filter['filter']
    if 'type' in raw_filter:
        return raw_filter['type']

    # NOTE(stephen): Only checking if it is an EmptyFilter if there is no filter type
    # defined. This is a pretty uncommon case.
    if isinstance(druid_filter, EmptyFilter):
        return 'empty'

    return 'unknown'


SIMPLE_FILTER_TYPES = ('selector', 'in', 'interval')


def hash_simple_filter(druid_filter: Filter, max_depth: int = 25) -> Optional[str]:
    if max_depth <= 0:
        return None

    filter_type = get_filter_type(druid_filter)
    raw_filter = druid_filter.filter['filter']
    new_depth = max_depth - 1

    # We can hash all filters that filter over a single dimension.
    if filter_type in SIMPLE_FILTER_TYPES:
        dimension = raw_filter['dimension']

        # The `selector` filter matches a single value for a dimension.
        if filter_type == 'selector':
            value = raw_filter['value']
            return f'selector|{dimension}|{value}'

        # The `in` filter matches multiple values for a single dimension. Sorting the
        # intervals helps this hash be stable.
        if filter_type == 'in':
            values_str = ','.join(sorted(raw_filter['values']))
            return f'in|{dimension}|{values_str}'

        # The `interval` filter matches multiple time boundaries over a dimension (usually
        # the primary `__time` dimension).
        if filter_type == 'interval' and not raw_filter.get('extractionFn'):
            intervals_str = ','.join(sorted(raw_filter['intervals']))
            return f'interval|{dimension}|{intervals_str}'

    # The `not` filter can only be hashed if the child filter it is referencing can
    # be hashed.
    if filter_type == 'not':
        child_filter_hash = hash_simple_filter(raw_filter['field'], new_depth)
        return f'not|{child_filter_hash}' if child_filter_hash else None

    # The `and/or` filter can only be hashed if all its children are hashable. We do not
    # allow nesting of `and/or` filters when computing this hash, so the children must
    # all be simple types or a `not` filters
    if filter_type in ('and', 'or'):
        child_filter_hashes = []
        for child_filter in raw_filter['fields']:
            child_filter_hash = hash_simple_filter(child_filter, new_depth)

            # If the child filter cannot be hashed, we can't build a hash for this
            # and/or filter at all.
            if not child_filter_hash:
                return None
            child_filter_hashes.append(child_filter_hash)
        child_filter_hash_str = ','.join(sorted(child_filter_hashes))
        return f'{filter_type}|{child_filter_hash_str}'

    # All other filter types are not hashable at this time.
    return None


def add_filters_to_collection(
    filters: List[Filter],
    collection_filter_type: str,
    collection: List[Filter],
    max_depth: int = 25,
):
    '''Add filters to a collection that holds filters *for* a common filter type. This
    collection is like the `fields` that are referenced by an AND filter. If any of the
    filters to be added already match the collection filter type (i.e. an AND filter
    inside an AND filter), then add their nested filter fields directly to the
    collection and try to flatten it.
    '''
    if max_depth <= 0:
        collection.extend(filters)
        return

    new_depth = max_depth - 1
    for druid_filter in filters:
        # If the inner filter type matches the collection's filter and it also has
        # multiple fields, we can flatten those fields to be added straight to the
        # collection.
        filter_type = get_filter_type(druid_filter)
        if isinstance(druid_filter, EmptyFilter):
            continue

        if filter_type == collection_filter_type and filter_type in ('and', 'or'):
            add_filters_to_collection(
                druid_filter.filter['filter']['fields'],
                collection_filter_type,
                collection,
                new_depth,
            )
        else:
            collection.append(druid_filter)


def optimize_query_filter(query_filter: Filter, max_depth: int = 25) -> Filter:
    '''Flatten query filters so that we reduce nesting of AND filters inside AND
    filters (or OR filters inside OR filters). If an AND/OR filter has a single field,
    just return that field as the filter. Remove duplicate filters that exist inside the
    AND/OR filter's field list.

    NOTE(stephen): Since this is a recursive call that is in the query hot path, we try
    to limit how deep the stack gets and try to safely guard against infinite recursion
    (even though it in theory is not possible).
    '''
    if max_depth <= 0 or isinstance(query_filter, EmptyFilter):
        return query_filter

    new_depth = max_depth - 1
    input_filter_type = get_filter_type(query_filter)

    # For `not` filters, we can optimize the filter field that will be inverted.
    if input_filter_type == 'not':
        optimized_child_filter = optimize_query_filter(
            query_filter.filter['filter']['field'], new_depth
        )
        return Filter(type='not', field=optimized_child_filter)

    # Only continue optimizing filter types that have multiple children.
    if input_filter_type not in ('and', 'or'):
        return query_filter

    # If there is only one child filter, we can just optimize it directly and return.
    child_filters = query_filter.filter['filter']['fields']
    if len(child_filters) == 1:
        return optimize_query_filter(child_filters[0], new_depth)

    # `inner_filters` contains the query filters that the `and/or` filter is operating
    # on.
    inner_filters: List[Filter] = []

    # All `not` filters will be merged into a single `not` filter.
    not_filters = []
    for orig_child_filter in child_filters:
        child_filter = optimize_query_filter(orig_child_filter, new_depth)
        child_filter_type = get_filter_type(child_filter)

        # Collapse all `not` filters into a single `not` filter.
        raw_child_filter = child_filter.filter['filter']
        if child_filter_type == 'not':
            not_filters.append(raw_child_filter['field'])
            continue

        # If the child filter type matches the input filter type then it will be
        # un-nested and flattened into the `inner_filters` list.
        if child_filter_type == input_filter_type:
            add_filters_to_collection(
                raw_child_filter['fields'], input_filter_type, inner_filters
            )
            continue

        # All other filter types should be added directly to the list without further
        # modification.
        inner_filters.append(child_filter)

    # Flatten the multiple NOT filters into a single filter. Build the merged inner
    # filter that the single NOT filter will reference. The inner filter should be the
    # opposite of the input parent filter's type since we are combining multiple NOTs
    # into a single value. It will be flattened later.
    if not_filters:
        if len(not_filters) > 1:
            flattened_not_child_filter = Filter(
                type=('and' if input_filter_type == 'or' else 'or'),
                fields=not_filters,
            )
            not_filter = Filter(
                type='not',
                field=optimize_query_filter(flattened_not_child_filter, new_depth),
            )
            inner_filters.append(not_filter)
        else:
            inner_filters.append(~not_filters[0])

    if len(inner_filters) == 1:
        return inner_filters[0]

    # Hash the filters and remove any duplicates since they are not necessary.
    # NOTE(stephen): This is a small optimization that takes on some pre-processing
    # work to reduce the query we send.
    filter_hashes = set()
    final_inner_filters = []
    for inner_filter in inner_filters:
        filter_hash = hash_simple_filter(inner_filter)
        if filter_hash:
            if filter_hash in filter_hashes:
                continue
            filter_hashes.add(filter_hash)
        final_inner_filters.append(inner_filter)
    return Filter(type=input_filter_type, fields=final_inner_filters)


# NOTE(stephen): These optimizations may not be worth maintaining if Druid can handle
# this for us. It has been a little useful to have this for queries that are enormous
# since it reduces the size of the query we send and also reduces the amount that Druid
# has to interpret when running a query. Right now, it seems like Druid does not perform
# many optimizations to reduce the filter set size, and it also has had some bugs
# related to duplicate filter evaluation
# (https://github.com/apache/druid/pull/10754 - Should be resolved in Druid ~0.22.0
# whenever that is released).
def apply_filter_optimizations(query: 'GroupByQueryBuilder') -> None:
    query.query_filter = optimize_query_filter(query.query_filter)
