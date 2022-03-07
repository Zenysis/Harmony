# mypy: disallow_untyped_defs=True
import itertools
import os

from typing import Dict, List, Tuple

from pydruid.utils.aggregators import (
    build_aggregators,
    filtered as filtered_aggregator,
    longsum,
)
from pydruid.utils.filters import Dimension as DimensionFilter

from db.druid.post_aggregations.theta_sketch import bound_sketch_size
from db.druid.query_client import DruidQueryClient
from log import LOG

# Flag to gate whether additional optimized sketch sizes should be fetched when the
# server starts.
ENABLE_GROUPED_SKETCH_SIZE_COMPUTATION = (
    os.getenv('DISABLE_GROUPED_SKETCH_SIZE_COMPUTATION') != '1'
)


def build_sketch_size(approximate_cardinality: float) -> int:
    '''Convert the approximate unique count for a dimension into a sketch size that is
    large enough to produce an exact unique count for a dimension when used.
    '''
    if approximate_cardinality <= 0:
        return 0

    # The sketch size is represented as powers of 2. The sketch size must be larger than
    # the true column cardinality to ensure that we produce an exact distinct count
    # (otherwise we will produce an approximate).
    # Use the number of bits it takes to represent the approximate distinct count as a
    # shorthand for computing the sketch size.
    bits = int(approximate_cardinality).bit_length()
    return bound_sketch_size(2 ** bits)


def build_dimension_size_metadata_aggregations(dimensions: List[str]) -> List[dict]:
    '''Build aggregations that will compute the approximate cardinality of the
    dimensions provided.

    We only need the approximate cardinality here since we are
    trying to quickly estimate the upper bound to use for the thetaSketch. The
    approximate value should be within 3% of the real value,
    https://datasketches.apache.org/docs/Theta/ThetaErrorTable.html, and would only
    result in us underestimating if the dimension's true cardinality was close to the
    boundary (number of unique values equals 2^15, 2^16, 2^17, etc.) AND the approximate
    value was slightly below the power of 2.
    '''
    return [
        {'type': 'thetaSketch', 'fieldName': dimension, 'name': dimension}
        for dimension in dimensions
    ]


def compute_dimension_sketch_sizes(
    query_client: DruidQueryClient,
    datasource_name: str,
    intervals: List[str],
    dimensions: List[str],
    batch_size: int = 8,
) -> Dict[str, int]:
    '''Calculate the minimum sketch size to use for each dimension provided that will
    ensure a thetaSketch calculation using that dimension will produce an *exact*
    distinct count.
    '''
    output = {}

    # Batch the dimensions to reduce the number of queries issued and improve
    # performance.
    it = iter(sorted(dimensions))
    while dimension_batch := list(itertools.islice(it, batch_size)):
        response = query_client.run_raw_query(
            {
                'dataSource': datasource_name,
                'intervals': intervals,
                'granularity': 'all',
                'queryType': 'timeseries',
                'aggregations': build_dimension_size_metadata_aggregations(
                    dimension_batch,
                ),
            }
        )
        result = response[0]['result'] if response else {}
        for dimension in dimension_batch:
            sketch_size = build_sketch_size(result.get(dimension, 0))
            output[dimension] = sketch_size
            LOG.debug('Sketch size %s for dimension %s', sketch_size, dimension)

    return output


def compute_eligible_high_cardinality_dimension_groupings(
    query_client: DruidQueryClient,
    datasource_name: str,
    intervals: List[str],
    dimensions: List[str],
    high_cardinality_dimensions: List[str],
) -> Dict[str, List[str]]:
    '''Determine which high cardinality dimensions have non-null values for each of the
    groupable dimensions provided. Returns a mapping from groupable dimension to the
    list of high cardinality dimensions that will have non-null values for that dimension
    grouping.
    '''
    LOG.debug('Building eligible dimension list for high cardinality optimization')

    output: Dict[str, List[str]] = {}
    base_aggregations = {}

    for dimension in dimensions:
        output[dimension] = []
        base_aggregations[dimension] = filtered_aggregator(
            DimensionFilter(dimension) != '', longsum('count')
        )

    for high_cardinality_dimension in high_cardinality_dimensions:
        response = query_client.run_raw_query(
            {
                'queryType': 'timeseries',
                'granularity': 'all',
                'dataSource': datasource_name,
                'intervals': intervals,
                'filter': {
                    'type': 'not',
                    'field': {
                        'type': 'selector',
                        'dimension': high_cardinality_dimension,
                        'value': '',
                    },
                },
                'aggregations': build_aggregators(
                    {
                        dimension: agg
                        for dimension, agg in base_aggregations.items()
                        if dimension != high_cardinality_dimension
                    }
                ),
            }
        )
        result = response[0]['result'] if response else {}

        for dimension in dimensions:
            if result.get(dimension, 0) > 0:
                output[dimension].append(high_cardinality_dimension)

    LOG.debug('Finished building eligible dimensions for high cardinality optimization')
    return output


def create_grouped_dimension_size_metadata_raw_query(
    datasource_name: str,
    intervals: List[str],
    grouped_dimension: str,
    high_cardinality_dimensions: List[str],
) -> dict:
    '''Build a raw Druid query that will calculate the approximate maximum distinct
    values for each high cardinality dimension across all groups. More plainly, we want
    to figure out how many unique values could possibly be included *per group* when the
    user queries for a high cardinality dimension AND groups by the provided dimension
    in the same query.
    '''

    # The query structure we build is a nested groupby query. The inner groupby will
    # calculate the approximate cardinality of *every* high cardinality dimension while
    # grouping by the provided `grouped_dimension`. We then take this inner groupby
    # result and compute the `MAX()` across all groups for each high cardinality
    # dimension. Since we don't care about the actual results for every group, we can
    # use this structure to avoid having Druid send a large result back to the client
    # and instead receive only the minimal amount of information back in the query
    # result.
    inner_aggregations = []
    inner_post_aggregations = []
    outer_aggregations = []
    for dimension in high_cardinality_dimensions:
        sketch_name = f'{dimension}_sketch'
        sketch_estimate_name = f'{dimension}_estimate'
        inner_aggregations.append(
            {'type': 'thetaSketch', 'fieldName': dimension, 'name': sketch_name}
        )

        # NOTE(stephen): For some reason, when using a nested groupby, I had to convert
        # the `thetaSketch` aggregation into a concrete estimate. Normally this happens
        # automatically when Druid "finalizes" a query, but apparently that finalization
        # doesn't happen for inner groupbys.
        inner_post_aggregations.append(
            {
                'type': 'thetaSketchEstimate',
                'name': sketch_estimate_name,
                'field': {'type': 'fieldAccess', 'fieldName': sketch_name},
            }
        )

        # Find the maximum sketch size computed for this dimension across all groups in
        # the inner query.
        outer_aggregations.append(
            {'type': 'longMax', 'fieldName': sketch_estimate_name, 'name': dimension}
        )

    # NOTE(stephen): Explicitly not filtering out `null` dimension values for the
    # grouped_dimension because during the optimization phase, we don't know whether
    # the null grouping value will be filtered out in the user's query or not.
    return {
        'queryType': 'groupBy',
        'granularity': 'all',
        'intervals': intervals,
        'dataSource': {
            'type': 'query',
            'query': {
                'queryType': 'groupBy',
                'dataSource': datasource_name,
                'granularity': 'all',
                'intervals': intervals,
                'dimensions': [grouped_dimension],
                'aggregations': inner_aggregations,
                'postAggregations': inner_post_aggregations,
            },
        },
        'aggregations': outer_aggregations,
    }


def compute_sketch_sizes_when_grouped(
    query_client: DruidQueryClient,
    datasource_name: str,
    intervals: List[str],
    dimensions: List[str],
    high_cardinality_dimensions: List[str],
) -> Dict[str, Dict[str, int]]:
    '''Calculate the maximum sketch size needed for a given high cardinality dimension
    when a query is grouped by at least one other dimension.

    Some deployments are heavy users of theta sketches and tuple sketches (via the
    Count Distinct and Cohort calculation types). These types of calculations require
    Druid to reserve additional memory for the query, because the data structure used
    for calculating dimension uniqueness is more complex than a simple sum or count.
    When the dimension being counted has a high cardinality (>= 32768), then it is
    possible for the user's query to fail. A majority of the time, this failure occurs
    when the user is querying for multiple sketches AND is grouping by at least one
    dimension at the same time. Druid has to reserve memory to hold the sketch *for each
    group* in the query result. For example, if the dimension being grouped on has 100
    unique values, then there will be 100 rows in the query result. If the user also
    is calculating a count distinct value, which uses a thetaSketch, then Druid will
    need to allocate space for a separate unique thetaSketch object for each row. This
    will result in 100x the memory usage for that sketch compared to having no grouping.

    This optimization allows us to calculate how large the sketch size should be for
    each high cardinality dimension when the user groups by a different dimension. This
    allows us to safely lower the sketch size without compromising on the "exact count
    distinct" guarantees we provide to the users (reminder: if the sketch size is lower
    than the total unique values that will be seen by that sketch, then the sketch will
    produce an approximate count distinct).

    This method returns a dictionary mapping a dimension to a dictionary holding the
    sketch sizes that can be used for the high cardinality dimensions.
    '''
    output = {}
    grouped_dimension_mapping = compute_eligible_high_cardinality_dimension_groupings(
        query_client,
        datasource_name,
        intervals,
        dimensions,
        high_cardinality_dimensions,
    )

    # NOTE(stephen): Sorting the grouped dimensions so that the order that we fetch the
    # metadata is the same across server restarts.
    for grouped_dimension in sorted(grouped_dimension_mapping):
        # NOTE(stephen): Sorting the high cardinality dimensions so that the query we
        # run is identical across server restarts. If the query shape changes, we risk
        # not being able to take advantage of Druid's cached values from previous runs.
        eligible_high_cardinality_dimensions = sorted(
            grouped_dimension_mapping[grouped_dimension]
        )
        if not eligible_high_cardinality_dimensions:
            continue

        query = create_grouped_dimension_size_metadata_raw_query(
            datasource_name,
            intervals,
            grouped_dimension,
            eligible_high_cardinality_dimensions,
        )
        response = query_client.run_raw_query(query)
        result = response[0]['event'] if response else {}

        sketch_sizes = {}
        for high_cardinality_dimension in eligible_high_cardinality_dimensions:
            approximate_cardinality = result.get(high_cardinality_dimension, 0)

            # NOTE(stephen): In theory, the approximate cardinality should always be
            # above zero since we filtered the high cardinality dimensions earlier.
            if approximate_cardinality > 0:
                sketch_sizes[high_cardinality_dimension] = build_sketch_size(
                    approximate_cardinality
                )

        if sketch_sizes:
            LOG.debug(
                'Optimized sketch sizes when grouping by dimension %s',
                grouped_dimension,
            )
            output[grouped_dimension] = sketch_sizes

    return output


def compute_sketch_sizes(
    query_client: DruidQueryClient,
    datasource_name: str,
    intervals: List[str],
    queryable_dimensions: List[str],
    dimension_id_map: Dict[str, str],
) -> Tuple[Dict[str, int], Dict[str, Dict[str, int]]]:
    '''Calculate the minimum sketch size to use when querying for a dimension inside a
    theta or tuple sketch.

    Returns a tuple containing:
        - A mapping from dimension to sketch size that will guarantee that a sketch
          using that size will never become "approximate".
        - A mapping from a dimension that a user groups by to a mapping from dimension
          to an optimized sketch size that applies only when the user groups by the
          specified dimension.
    '''
    # The sketch dimensions are the list of dimensions that will be used inside a theta
    # or tuple sketch.
    # NOTE(stephen): If a dimension has a corresponding ID column in Druid then that
    # column will be used inside the sketch when querying.
    sketch_dimensions = set(dimension_id_map.values())
    for dimension in queryable_dimensions:
        if dimension not in dimension_id_map:
            sketch_dimensions.add(dimension)

    LOG.info('Building sketch sizes')
    sketch_sizes = compute_dimension_sketch_sizes(
        query_client, datasource_name, intervals, sorted(sketch_dimensions)
    )
    LOG.info('Finished building sketch sizes')

    # Find the dimensions that have a high number of unique values.
    high_cardinality_dimensions = [
        dimension
        for dimension, sketch_size in sketch_sizes.items()
        if sketch_size >= 32768
    ]

    if not high_cardinality_dimensions or not ENABLE_GROUPED_SKETCH_SIZE_COMPUTATION:
        return (sketch_sizes, {})

    LOG.info(
        'Optimizing high cardinality dimension queries for %s dimensions',
        len(high_cardinality_dimensions),
    )
    grouped_sketch_sizes = compute_sketch_sizes_when_grouped(
        query_client,
        datasource_name,
        intervals,
        queryable_dimensions,
        high_cardinality_dimensions,
    )
    LOG.info('Finished optimizing high cardinality dimension queries')

    return (sketch_sizes, grouped_sketch_sizes)
