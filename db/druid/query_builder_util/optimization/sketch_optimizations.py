# mypy: disallow_untyped_defs=True
import json
import re

from collections import OrderedDict
from typing import Any, Callable, Dict, Iterable, List, Set, TYPE_CHECKING, Tuple, Union

from pydruid.utils.aggregators import filtered as filtered_aggregator, longsum
from pydruid.utils.having import Aggregation as HavingAggregation


from db.druid.calculations.unique_calculations import TupleSketchUniqueCountCalculation
from db.druid.post_aggregations.theta_sketch import (
    ThetaSketchEstimatePostAggregation,
    ThetaSketchPostAggregation,
    TupleSketchEstimatePostAggregation,
)
from db.druid.util import (
    EmptyFilter,
    build_filter_from_dict,
    build_query_filter_from_aggregations,
)

# NOTE(stephen): Avoid circular dependency.
if TYPE_CHECKING:
    from db.druid.query_builder import GroupByQueryBuilder

# Pattern for extracting the indices referenced by a arrayOfDoublesFilterExpression.
# TODO(stephen): Consolidate duplicate uses of this expression here.
TUPLE_EXPRESSION_FIELD_MATCH_PATTERN = re.compile('(\\$[0-9]+)')


def _find_sketch_aggregations(
    query: 'GroupByQueryBuilder', *types: str
) -> Dict[str, dict]:
    return {
        agg_id: agg
        for agg_id, agg in query.aggregations.items()
        if agg['type'] in types
        or (agg['type'] == 'filtered' and agg['aggregator']['type'] in types)
    }


def _hash_aggregator(agg: dict) -> str:
    '''Create a hash string for the given aggregator.'''
    # NOTE(stephen): JSON string representation is the fastest and easiest way to get
    # a stable hash. The aggregator can have an unknown depth (like if a complex filter
    # is applied) and I didn't want to build a recursive solution.
    return json.dumps(agg, sort_keys=True)


def _find_string_dimensions(dimensions: List[Union[str, dict]]) -> List[str]:
    '''Find all dimensions that are represented as a string. Remove DimensionSpecs
    (dimension as a dictionary) from the dimension list since we cannot optimize that
    case right now.
    '''
    return [dimension for dimension in dimensions if isinstance(dimension, str)]


def _get_sketch_sizes_when_grouped() -> Dict[str, Dict[str, int]]:
    '''Return the maximum sketch sized needed for a high cardinality dimension when a
    query is grouped by at least one other dimension.

    This method returns a dictionary mapping a grouping dimension to a dictionary
    holding the sketch sizes that can be used when the grouping dimension grouped by in
    the query.
    '''

    # NOTE(stephen): We want the ability to catch broad exceptions below so that we
    # never crash while applying an optimization. We also need to use dynamic imports so
    # that this can be used in library code.
    # pylint: disable=broad-except,import-outside-toplevel

    # The optimized grouped dimension sketch sizes only exist within a Flask app since
    # they are dynamically generated on server start.
    try:
        # $ConfigImportHack
        from flask import current_app, has_app_context

        if has_app_context():
            return (
                current_app.druid_context.dimension_metadata.grouped_dimension_sketch_sizes
            )
    except ModuleNotFoundError:
        # We're likely running from the pipeline.
        pass
    except Exception:
        # An unknown exception occurred. We cannot use this optimization and should
        # leave the query unmodified.
        pass

    return {}


def _build_optimized_sketch_sizes_for_query(
    query: 'GroupByQueryBuilder',
) -> Dict[str, int]:
    '''Build an optimized minimum sketch size that can be used for sketch aggregators
    and post aggregators in this query. This optimized sketch size can be used to safely
    replace the sketch size of existing aggregators and post aggregators in the query
    without reducing accuracy or entering the "approximate count distinct" territory.
    '''
    # When the query has grouping dimensions, the size of the sketch aggregators can
    # potentially be much smaller without sacrificing accuracy. This is because the
    # grouping dimensions can cause fewer unique values to pass through the sketch. An
    # example would be the user grouping by Province and District. Say there are 100
    # unique districts in a country and 10 provinces. Each province has 10 districts,
    # and no district can exist in more than one province. If the user groups by
    # province and has a sketch over the district dimension, then the total number of
    # unique districts that can possibly pass through each province's sketch aggregator
    # would be 10. Therefore, we don't need the sketch to be large enough to hold 100
    # unique districts and can instead lower the size to hold 10 unique districts. This
    # example is simplified, and reality we are only performing this optimization for
    # high cardinality dimensions that can have a real impact on query performance and
    # memory usage.
    grouping_dimensions = _find_string_dimensions(query.dimensions)

    # If the query has subtotals, it changes the number of rows that will pass through
    # a sketch. Even though the query is grouped by some dimensions, the subtotals spec
    # tells Druid to add additional rows to the query result that "roll up" rows from
    # the base query result. This subtotal action can cause the sketches to have more
    # rows pass through them than what a normal group in the base query result would
    # see. An example is having a "grand total" calculated via the subtotals feature of
    # the query. Even if the query is grouped by N dimensions, with each group only
    # seeing a small number of rows, the "grand total" calculation must see *all* rows
    # in order to produce that final value. Therefore, we must find the set of
    # dimensions that exist in every subtotal grouping configuration to know what the
    # effective grouping will be. In the "grand total" case (represented by an empty
    # subtotal group `[]`), then the number of rows that will pass through the sketch
    # will be *all* rows seen by the entire query, regardless of group. This would mean
    # we could not optimize the sketch size.
    if query.subtotals:
        common_subtotal_dimensions = set(grouping_dimensions)
        for subtotal_group in query.subtotals.subtotal_spec:
            common_subtotal_dimensions = common_subtotal_dimensions.intersection(
                _find_string_dimensions(subtotal_group)
            )
        grouping_dimensions = list(common_subtotal_dimensions)

    # If no grouping dimensions are selected, we cannot further optimize the sketch
    # sizes.
    if not grouping_dimensions:
        return {}

    grouped_sketch_sizes = _get_sketch_sizes_when_grouped()

    # Find the minimum sketch sizes that are possible based on the grouping dimensions
    # selected in this query.
    optimized_sketch_sizes = {}
    for dimension in grouping_dimensions:
        # Any sketch that operates over a grouping dimension will only ever see 1 unique
        # value.
        # NOTE(stephen): The minimum sketch size defined by Druid is 16, even though we
        # don't need that many slots.
        optimized_sketch_sizes[dimension] = 16

        if dimension not in grouped_sketch_sizes:
            continue

        minimum_sketch_sizes_for_group = grouped_sketch_sizes[dimension]
        for sketch_dimension, sketch_size in minimum_sketch_sizes_for_group.items():
            # NOTE(stephen): We want to take the minimum sketch size found for this
            # sketch dimension across any previous groups.
            current_min = optimized_sketch_sizes.get(sketch_dimension, sketch_size)
            optimized_sketch_sizes[sketch_dimension] = min(current_min, sketch_size)

    return optimized_sketch_sizes


def _walk_sketch_post_aggregators(
    post_aggs: Iterable[Any], callback: Callable[[dict], bool]
) -> None:
    '''Recursively walk through every nested post aggregator and call the callback with
    the post agg. If the callback returns True, any post aggregators nested inside the
    outer post agg will be processed.
    '''
    new_post_aggs_to_process = []
    for post_agg in post_aggs:
        # It is possible for this method to receive both the built post aggregator (in
        # dict form) and the non-built version (in class instance form with a
        # `post_aggregator` property).
        if not isinstance(post_agg, dict):
            post_agg = post_agg.post_aggregator

        continue_processing_post_agg = callback(post_agg)
        if not continue_processing_post_agg:
            continue

        # It is possible for a thetaSketch post aggregation to be nested inside a
        # non thetaSketch post agg. An example is a formula style calculation like
        # (numerator / sketch_denominator). The outer post aggregation will contain
        # a list of these fields, but the sketch_denominator would have to be a
        # thetaSketchEstimate. This can contain additional nested references to
        # other thetaSketches, however that will be unpacked later. The outer post
        # agg can in theory be of arbitrary depth, so we will have to recurse
        # through until the end.
        if post_agg.get('fields'):
            new_post_aggs_to_process.extend(post_agg['fields'])
        elif post_agg.get('field'):
            new_post_aggs_to_process.append(post_agg['field'])

    if new_post_aggs_to_process:
        _walk_sketch_post_aggregators(new_post_aggs_to_process, callback)


# pylint: disable=invalid-name
def _collect_sketch_estimate_post_aggregators(
    post_aggs: Iterable[Any], *types: str
) -> List[dict]:
    '''Collect every SketchEstimate post aggregation seen. This will not include
    any sketches inside the estimate, only the estimate post agg itself.
    '''
    output = []

    def collect_post_agg(post_agg: dict) -> bool:
        if post_agg['type'] in types:
            output.append(post_agg)
            return False
        return True

    _walk_sketch_post_aggregators(post_aggs, collect_post_agg)
    return output


def _replace_sketch_reference(
    replacements: Dict[str, List[str]], post_aggregations: List[dict]
) -> Set[str]:
    '''Replace the usage of the original sketch ID with the new consolidated sketch ID.

    Args:
        replacements - Mapping from new sketch agg ID to the original agg IDs that it
            replaces.
        post_aggregations - List of thetaSketchEstimate post aggregations to recurse
            through and replace references.
    Return:
        Set[str] - The list of sketch agg ids that are intermediary sketches only. They
            are referenced inside another post aggregation and do not stand on their
            own.
    '''
    intermediary_agg_ids = set()
    agg_to_replacement = {}
    for new_sketch_id, agg_ids in replacements.items():
        for agg_id in agg_ids:
            agg_to_replacement[agg_id] = new_sketch_id

    def replace_sketch_reference(post_agg: dict) -> bool:
        if post_agg['type'] != 'fieldAccess':
            return True

        field_name = post_agg['fieldName']
        if field_name in agg_to_replacement:
            post_agg['fieldName'] = agg_to_replacement[field_name]
            intermediary_agg_ids.add(field_name)

        return False

    _walk_sketch_post_aggregators(post_aggregations, replace_sketch_reference)
    return intermediary_agg_ids


def _get_sketch_aggregator_size(agg: dict) -> int:
    if agg['type'] == 'filtered':
        agg = agg['aggregator']
    if agg['type'].startswith('arrayOf'):
        return agg['nominalEntries']
    return agg['size']


def _set_sketch_aggregator_size(agg: dict, size: int) -> None:
    if agg['type'] == 'filtered':
        agg = agg['aggregator']
    if agg['type'].startswith('arrayOf'):
        agg['nominalEntries'] = size
    else:
        agg['size'] = size


def _set_sketch_post_aggregator_size(post_agg: dict, size: int) -> None:
    if post_agg['type'].startswith('arrayOf'):
        post_agg['nominalEntries'] = size
    else:
        post_agg['size'] = size


def _remap_filter_expression_variables(
    expression: str, metric_filter_remap: Dict[int, int]
) -> str:
    '''Replace the original metric filter index with the new metric filter index in the
    arrayOfDoublesFilterExpression.

    NOTE(stephen): This method is basically the same as post_aggregation_builder's
    `add_suffix_to_expression`. We just aren't adding a suffix, we're replacing the
    expression variable reference.
    '''
    pieces = []
    prev = 0
    for match in TUPLE_EXPRESSION_FIELD_MATCH_PATTERN.finditer(expression):
        (start, end) = match.span()
        pieces.append(expression[prev:start])

        # Convert the $x variable into an integer.
        original_idx = int(match.group()[1:])
        new_idx = metric_filter_remap[original_idx]
        pieces.append(f'${new_idx}')
        prev = end

    pieces.append(expression[prev:])
    return ''.join(pieces)


def _collapse_repeated_tuple_sketch_aggs(
    consolidated_id: str, agg_details_list: List[dict]
) -> Tuple[List[dict], Dict[str, Tuple[str, Dict[int, int]]]]:
    '''Consolodate all metricFilters used by the aggregations provided into a single
    list. Build a mapping that associates original aggregation ID to the new aggregation
    ID and a mapping of how to rewrite the arrayOfDoublesFilterExpression expression to
    use the new collapsed aggregation.
    '''

    # Mapping from original aggregation ID to the new agg ID and a mapping of metric
    # filter indexes. This metric filter index map points from
    # old metric filter index -> new metric filter index in the consolidated sketch.
    agg_metric_filter_remap: Dict[str, Tuple[str, Dict[int, int]]] = {}

    # Merge the metric filters together and store a mapping from their original
    # index to their new index.
    consolidated_metric_filters: List[dict] = []

    # If a metric filter exists across multiple sketches, only store one reference
    # to it.
    hashed_metric_filters: Dict[str, int] = {}

    for sketch_settings in agg_details_list:
        agg_id = sketch_settings['id']
        # Store a mapping from original metric filter index in the original sketch
        # to the new metric filter index in the consolidated sketch.
        metric_filter_remap = {}
        metric_filters = sketch_settings['metricFilters']

        for original_idx, metric_filter in enumerate(metric_filters):
            metric_filter_hash = _hash_aggregator(metric_filter)
            new_idx = len(consolidated_metric_filters)

            # If this metric filter was already referenced by a different sketch,
            # we can just reuse it.
            if metric_filter_hash in hashed_metric_filters:
                new_idx = hashed_metric_filters[metric_filter_hash]
            else:
                # Otherwise, add it as a new metric filter for the combined sketch
                # to use.
                new_idx = len(consolidated_metric_filters)
                consolidated_metric_filters.append(metric_filter)
                hashed_metric_filters[metric_filter_hash] = new_idx
            metric_filter_remap[original_idx] = new_idx
        agg_metric_filter_remap[agg_id] = (consolidated_id, metric_filter_remap)
    return (consolidated_metric_filters, agg_metric_filter_remap)


# pylint: disable=too-many-branches
def optimize_repeated_tuple_sketches(
    query: 'GroupByQueryBuilder', sketch_aggs: Dict[str, dict]
) -> None:
    '''If multiple arrayOfFilteredDoublesSketch tuple sketches are calculated for the
    same dimension, then they can be safely merged into a single tuple sketch.
    '''
    if not sketch_aggs or len(sketch_aggs) == 1:
        return

    # Find any arrayOfFilteredDoublesSketch aggregations that operate on the same field.
    # TODO(david): Fix this type
    agg_to_details: Dict[Any, Any] = {}
    has_duplicates = False
    for agg_id, agg in sketch_aggs.items():
        # Skip filtered aggregations. These shouldn't really exist with proper usage of
        # the arrayOfFilteredDoublesSketch since you should filter the individual
        # metricFilters inside the sketch.
        if agg['type'] == 'filtered':
            continue

        # Since the sketch can store an arbitrary list of metricFilters, we remove them
        # before hashing. If we find multiple sketches that are equivalent (except for
        # the metricFilters) then we can combine the sketches metricFilters together.
        agg_hash = _hash_aggregator({**agg, 'metricFilters': [], 'numberOfValues': 0})
        if agg_hash not in agg_to_details:
            agg_to_details[agg_hash] = []
        else:
            has_duplicates = True
        agg_to_details[agg_hash].append(
            {'id': agg_id, 'metricFilters': agg['metricFilters']}
        )

    if not has_duplicates:
        return

    # Consolidate each repeated sketch into a single aggregation and replace any usages
    # of it with the new ID.
    seq = 0

    # Mapping from original aggregation ID to the new agg ID and a mapping of metric
    # filter indexes. This metric filter index map points from
    # old metric filter index -> new metric filter index in the consolidated sketch.
    agg_metric_filter_remap: Dict[str, Tuple[str, Dict[int, int]]] = {}

    # First build a new consolidated ID and associate all equivalent aggregations to it.
    for agg_details in agg_to_details.values():
        if len(agg_details) < 2:
            continue

        consolidated_id = f'consolidated_tuple_sketch__{seq}'
        (
            consolidated_metric_filters,
            new_agg_metric_filter_remap,
        ) = _collapse_repeated_tuple_sketch_aggs(consolidated_id, agg_details)

        # Merge in the remap settings built during the collapse of these aggregators.
        agg_metric_filter_remap.update(new_agg_metric_filter_remap)

        # Remove all the original aggregations from the query.
        base_agg = {}
        for idx, sketch_settings in enumerate(agg_details):
            agg_id = sketch_settings['id']

            # NOTE(stephen): Using the first aggregator as the base since it doesn't
            # matter which one we choose.
            if idx == 0:
                base_agg = query.aggregations[agg_id]
            query.aggregations.pop(agg_id)

        # Build the consolidated aggregator and add it to the query.
        consolidated_agg = {
            **base_agg,
            'metricFilters': consolidated_metric_filters,
            'numberOfValues': len(consolidated_metric_filters),
        }

        query.aggregations[consolidated_id] = consolidated_agg
        seq += 1

    # Next, replace the references to the original aggregation to the new consolidated
    # aggregation. Update the filter expressions to reference the new location of the
    # metric filter in the consolidated aggregation.
    sketch_post_aggs = _collect_sketch_estimate_post_aggregators(
        query.post_aggregations.values(), 'arrayOfDoublesSketchToEstimate'
    )

    for post_agg in sketch_post_aggs:
        # Access the inner field of the post aggregation that *should* be of type
        # arrayOfDoublesFilterExpression.
        inner_field = post_agg.get('field')
        if not inner_field or inner_field['type'] != 'arrayOfDoublesFilterExpression':
            continue

        # The arrayOfDoublesFilterExpression can only operate on a single aggregator.
        agg_field_access = inner_field['field']
        original_agg_id = agg_field_access['fieldName']
        if original_agg_id not in agg_metric_filter_remap:
            continue

        # Replace the aggregation referenced by this post aggregator with the new
        # consolidated aggregator ID. Update the filter expression to replace the
        # variables that reference the original indices of the dependent metric filters
        # with the new indices in the consolidated aggregator.
        (consolidated_id, metric_filter_remap) = agg_metric_filter_remap[
            original_agg_id
        ]
        agg_field_access['fieldName'] = consolidated_id
        inner_field['expression'] = _remap_filter_expression_variables(
            inner_field['expression'], metric_filter_remap
        )


def optimize_repeated_theta_sketches(
    query: 'GroupByQueryBuilder', sketch_aggs: Dict[str, dict]
) -> None:
    '''If the exact same thetaSketch is used multiple times, we can consolidate it to
    only be called once. This improves memory usage for the query since it won't need to
    calculate the same (potentially large) theta sketch  multiple times.
    '''
    if not sketch_aggs or len(sketch_aggs) == 1:
        return

    # Find any thetaSketch aggregations that are repeated.
    # TODO(david): Fix this type
    agg_to_ids: Dict[Any, Any] = {}
    has_duplicates = False
    for agg_id, agg in sketch_aggs.items():
        agg_hash = _hash_aggregator(agg)
        if agg_hash not in agg_to_ids:
            agg_to_ids[agg_hash] = []
        else:
            has_duplicates = True
        agg_to_ids[agg_hash].append(agg_id)

    if not has_duplicates:
        return

    # Consolidate each repeated sketch into a single aggregation and replace any usages
    # of it with the new ID.
    seq = 0
    replacements = {}

    # First build a new consolidated ID and associate all equivalent aggregations to it.
    for agg_ids in agg_to_ids.values():
        if len(agg_ids) < 2:
            continue
        consolidated_id = f'consolidated_sketch__{seq}'
        replacements[consolidated_id] = agg_ids
        seq += 1

    sketch_post_aggs = _collect_sketch_estimate_post_aggregators(
        query.post_aggregations.values(), 'thetaSketchEstimate'
    )

    # Next, update all post-aggregations *in-place* that might have referenced the old
    # aggregator IDs. Collect the agg ids that are only used inside a post aggregation
    # and don't need to be preserved.
    intermediary_agg_ids = _replace_sketch_reference(replacements, sketch_post_aggs)

    post_aggs = OrderedDict()

    # Then, remove the original aggregations, add the single consolidated aggregation,
    # and provide a mapping from the consolidated aggregation to the original ID in case
    # user's of the query are expecting results for that field ID.
    for consolidated_id, agg_ids in replacements.items():
        for i, agg_id in enumerate(agg_ids):
            # Remove the original aggregation since it is now consolidated.
            agg = query.aggregations.pop(agg_id)
            # Add the consolidated aggregation once.
            if i == 0:
                query.aggregations[consolidated_id] = agg
            # Link the original aggregation ID to the consolidated ID using a post
            # aggregation.
            if agg_id not in intermediary_agg_ids:
                post_aggs[agg_id] = ThetaSketchEstimatePostAggregation(
                    ThetaSketchPostAggregation(consolidated_id)
                )
    # HACK(david): Ensure that post aggregations are added as the first post
    # aggregations in the query in case they are referenced by formula
    # calcuation post aggregations
    # TODO(david): We should really do some proper post-agg sorting before
    # issuing queries.
    query.post_aggregations = {**post_aggs, **query.post_aggregations}


def optimize_multiple_theta_sketches_on_same_dimension(
    query: 'GroupByQueryBuilder', sketch_aggs: Dict[str, dict]
) -> None:
    '''If multiple thetaSketch aggregations are operating on the same dimension, we can
    consolidate these aggregations to be part of a single tuple sketch. This improves
    memory usage for the query since only one sketch will be needed for the dimension
    instead of many.
    '''
    if not sketch_aggs or len(sketch_aggs) == 1:
        return

    # Certain aggregators cannot be optimized right now. If a thetaSketch-specific post
    # aggregator is used, the thetaSketch aggregation it refers to cannot be as easily
    # optimized. While we could migrate the `thetaSketchSetOp` to something that the
    # tuple sketch can perform, it's not that easy to extract out the post agg and
    # replace it. For now, this situation is uncommon, so it is ok to leave this
    # optimization out to make the code easier to follow.
    non_optimizable_agg_ids = set()
    sketch_post_aggs = _collect_sketch_estimate_post_aggregators(
        query.post_aggregations.values(), 'thetaSketchEstimate', 'thetaSketchSetOp'
    )

    def collect_non_optimizable_agg_ids(post_agg: dict) -> bool:
        if post_agg['type'] != 'fieldAccess':
            return True

        non_optimizable_agg_ids.add(post_agg['fieldName'])
        return False

    _walk_sketch_post_aggregators(sketch_post_aggs, collect_non_optimizable_agg_ids)

    # Group all theta sketch aggregations by the dimension that they operate on.
    aggs_by_dimension: Dict[str, Dict[str, dict]] = {}
    for agg_id, agg in sketch_aggs.items():
        if agg_id in non_optimizable_agg_ids:
            continue

        dimension = (
            agg['aggregator']['fieldName']
            if agg['type'] == 'filtered'
            else agg['fieldName']
        )
        if dimension not in aggs_by_dimension:
            aggs_by_dimension[dimension] = {}
        aggs_by_dimension[dimension][agg_id] = agg

    # Build a tuple calculation for each dimension that a thetaSketch aggregator is
    # operating on.
    for dimension, agg_map in aggs_by_dimension.items():
        # NOTE(stephen): It is possible that we are missing future optimizations here
        # since it could be worth converting a theta sketch into a tuple sketch *if*
        # there is also a tuple sketch already operating on the same dimension. Since
        # our optimizations are standalone right now, it is a bit ugly to test for this
        # case.
        if len(agg_map) < 2:
            continue

        # NOTE(stephen): Pull the sketch size from the first aggregation in the map.
        size = _get_sketch_aggregator_size(next(iter(agg_map.values())))
        tuple_calc = TupleSketchUniqueCountCalculation(
            f'consolidated_tuple_sketch__{dimension}',
            dimension,
            size,
        )
        for agg_id, agg in agg_map.items():
            # The TupleSketch calculation requires the pydruid filter style.
            agg_filter = (
                build_filter_from_dict(agg['filter'])
                if agg['type'] == 'filtered'
                else None
            )

            # Remove this aggregation from the original query since it will now be
            # calculated inside a tuple sketch.
            query.aggregations.pop(agg_id)

            # Convert this aggregator (which was a COUNT DISTINCT thetaSketch with an
            # optional filter) into a metric that is calculated by the TupleSketch. This
            # will produce the same result as the original thetaSketch aggregation.
            metric_idx = tuple_calc.add_metric('count', agg_filter)
            tuple_calc.add_estimate_post_aggregation(agg_id, f'${metric_idx} > 0')

        # Now that we have migrated all aggregations out of the original query and into
        # the tuple sketch, we can update the query with the tuple sketch pieces that
        # will produce an equivalent COUNT DISTINCT result.
        query.aggregations.update(tuple_calc.aggregations)
        query.post_aggregations = {
            **tuple_calc.post_aggregations,
            **query.post_aggregations,
        }


def optimize_repeated_sketches(query: 'GroupByQueryBuilder') -> None:
    theta_sketch_aggs = _find_sketch_aggregations(query, 'thetaSketch')
    optimize_repeated_theta_sketches(query, theta_sketch_aggs)

    # NOTE(stephen): Need to collect the theta sketch aggs again because the duplicated
    # ones have now been consolidated. The original `theta_sketch_aggs` variable is out
    # of date.
    theta_sketch_aggs = _find_sketch_aggregations(query, 'thetaSketch')
    optimize_multiple_theta_sketches_on_same_dimension(query, theta_sketch_aggs)

    tuple_sketch_aggs = _find_sketch_aggregations(query, 'arrayOfFilteredDoublesSketch')
    optimize_repeated_tuple_sketches(query, tuple_sketch_aggs)


def optimize_sketch_size(query: 'GroupByQueryBuilder') -> None:
    '''For certain queries, we can lower the sketch size from the size provided to a
    smaller value without affecting sketch accuracy.'''
    optimized_sketch_sizes = _build_optimized_sketch_sizes_for_query(query)

    if not optimized_sketch_sizes:
        return

    # We can optimize the sketch size of both Theta Sketches and Tuple Sketches.
    sketch_aggs = _find_sketch_aggregations(
        query, 'thetaSketch', 'arrayOfFilteredDoublesSketch'
    )
    if not sketch_aggs:
        return

    # Update the aggregator size to use the optimized sketch size, when possible.
    # Collect the final aggregator size so that we can optimize the post aggregator
    # sizes as well.
    agg_sizes = {}
    for agg_id, agg in sketch_aggs.items():
        sketch_agg = agg['aggregator'] if agg['type'] == 'filtered' else agg
        sketch_dim = sketch_agg['fieldName']

        # Set the new sketch size to be the optimized sketch size for this dimension, if
        # it exists.
        sketch_size = optimized_sketch_sizes.get(
            sketch_dim,
            _get_sketch_aggregator_size(sketch_agg),
        )

        # Record the new sketch size for this aggregator and update the aggregator to
        # use the new size.
        agg_sizes[agg_id] = sketch_size
        _set_sketch_aggregator_size(sketch_agg, sketch_size)

    # Finally, update the post aggregator sketch sizes to be in sync with the
    # aggregator's sketch size. The post aggregators collected here are the ones that
    # actually have a size set on them.
    sketch_post_aggs = _collect_sketch_estimate_post_aggregators(
        query.post_aggregations.values(),
        'thetaSketchSetOp',
        'arrayOfDoublesFilterExpression',
    )
    post_agg_sizes: Dict[str, int] = {}

    def get_referenced_sketch_size(post_agg: dict) -> int:
        '''Find the sketch size for the sketch referenced by this post aggregator. The
        post aggregator can hold a reference to an aggregator sketch *or* a post
        aggregator sketch.
        '''
        sketch_id = (
            post_agg['fieldName']
            if post_agg['type'] == 'fieldAccess'
            else post_agg['name']
        )

        if sketch_id in post_agg_sizes:
            return post_agg_sizes[sketch_id]
        return agg_sizes[sketch_id]

    # For each post aggregator, set the size of that post aggregator to be the maximum
    # sketch size referenced inside that post aggregator (either by accessing an
    # aggregator sketch or by accessing another sketch post aggregator).
    # NOTE(stephen): Iterating in reverse order since sketch post aggregators can
    # contain other sketch post aggregators and the order we receive is from outermost
    # to innermost post aggregator.
    for post_agg in reversed(sketch_post_aggs):
        inner_post_aggs = (
            post_agg['fields'] if 'fields' in post_agg else [post_agg['field']]
        )
        post_agg_size = max(
            get_referenced_sketch_size(inner_post_agg)
            for inner_post_agg in inner_post_aggs
        )
        post_agg_sizes[post_agg['name']] = post_agg_size
        _set_sketch_post_aggregator_size(post_agg, post_agg_size)


def optimize_row_result_set_filter(query: 'GroupByQueryBuilder') -> None:
    '''Remove rows from the query result that have all 0 values for sketch calculations
    and null values for non-sketch calculations.

    Calculations on ThetaSketches and TupleSketches can sometimes result in a query
    which will include more rows than is expected. Normally when the GroupByQueryBuilder
    constructs the outer filter, it builds it off the filtered aggregations being
    calculated. This works well when non-sketch calculations are not used, since we can
    just directly take all filtered aggregations and OR them together. With complex
    sketch usage (like ThetaSketch or TupleSketch) usage, though, this becomes more
    difficult. Certain sketch operations (like a CohortCalculation) can cause the query
    to have its outer filter removed. This can cause significantly more rows to appear
    in the result than is expected. This optimzation filters out those rows.

    NOTE(stephen): This is harder than it should be since we have to deduce the fields
    requested by the user.
    NOTE(stephen): This is the most complicated optimization so far.
    '''
    # We need to perform this optimization for theta and tuple sketch types.
    sketch_aggs = _find_sketch_aggregations(
        query, 'thetaSketch', 'arrayOfFilteredDoublesSketch'
    )
    if not sketch_aggs:
        return

    sketch_post_aggs = _collect_sketch_estimate_post_aggregators(
        query.post_aggregations.values(),
        'thetaSketchEstimate',
        'arrayOfDoublesSketchToEstimate',
    )

    # If the query already has a having clause, we cannot perform this optimization.
    if query.having:
        return

    # Collect all columns that should be included in the having clause. These should
    # essentially be all fields requested by the user.
    having_fields = set()

    # Create a tracer field to count the number of rows that pass into the
    # non theta sketch aggregations. This is needed to effectively test if the other
    # aggregations would have been naturally filtered out if the theta sketch
    # aggregations were not present and affecting the filter.
    non_sketch_agg_ids = (
        set(query.aggregations.keys())
        - set(
            query.calculation.count_field_name(field)
            for field in query.calculation.strict_null_fields
        )
        - set(sketch_aggs.keys())
    )
    non_sketch_aggs = {
        agg_id: query.aggregations[agg_id] for agg_id in non_sketch_agg_ids
    }

    # Build a combined filter that matches all non-sketch calculations.
    non_sketch_agg_filter = build_query_filter_from_aggregations(non_sketch_aggs)
    non_sketch_agg_id = 'non_sketch_agg_count_for_having'
    if non_sketch_aggs:
        # If non sketch aggregators exist but a query filter can not be built for them,
        # we are unable to optimize this query.
        if isinstance(non_sketch_agg_filter, EmptyFilter):
            return

        # Otherwise, add a tracer count field with this filter applied
        query.aggregations[non_sketch_agg_id] = filtered_aggregator(
            filter=non_sketch_agg_filter, agg=longsum('count')
        )
        having_fields.add(non_sketch_agg_id)

    # Collect the IDs of all SketchEstimate post aggregations. We can ignore any other
    # post aggregation type since it will be included in the non_sketch_agg_filter.
    for post_agg_id, post_agg in query.post_aggregations.items():
        # Assume that all SketchEstimates in the outermost post aggregation level are
        # requested by the user.
        if isinstance(
            post_agg,
            (ThetaSketchEstimatePostAggregation, TupleSketchEstimatePostAggregation),
        ):
            having_fields.add(post_agg_id)

    # If a sketch aggregation is only used as part of a larger theta sketch post
    # aggregation, exclude it from the requested list. Otherwise, assume that it is
    # going to be returned to the user.
    # NOTE(stephen): Right now, it is not possible for the user to request the
    # individual pieces of a CohortCalculation. If that changes, we will need a new way
    # of applying this optimization.
    # NOTE(stephen): This really only matters for ThetaSketch and does not matter for
    # TupleSketch since the TupleSketch is generally collapsed into a single
    # calculation, while the ThetaSketch requires many different sketches to perform
    # set operations on.
    having_fields.update(sketch_aggs.keys())

    def remove_internal_sketches(post_agg: dict) -> bool:
        if post_agg['type'] != 'fieldAccess':
            return True

        sketch_agg_id = post_agg['fieldName']
        if sketch_agg_id in having_fields:
            having_fields.remove(sketch_agg_id)
        return False

    _walk_sketch_post_aggregators(sketch_post_aggs, remove_internal_sketches)

    # Build a `having` clause that tests to see if *any* of the requested fields have
    # a value greater than zero. If they do, then we can include the row in the final
    # result.
    having_clause = None
    for field_id in having_fields:
        having_test = HavingAggregation(field_id) > 0
        if not having_clause:
            having_clause = having_test
        else:
            having_clause = having_clause | having_test

    query.having = having_clause


def apply_sketch_optimizations(query: 'GroupByQueryBuilder') -> None:
    optimize_repeated_sketches(query)
    optimize_sketch_size(query)
    optimize_row_result_set_filter(query)
