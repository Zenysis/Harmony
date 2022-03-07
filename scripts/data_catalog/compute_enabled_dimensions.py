import os

from typing import List

from config.aggregation_rules import CALCULATIONS_FOR_FIELD
from config.druid_base import FIELD_NAME
from data.query.models.calculation import Calculation, ComplexCalculation
from db.druid.aggregations.query_dependent_aggregation import QueryDependentAggregation
from db.druid.calculations.complex_calculation import (
    ComplexCalculation as DruidComplexCalculation,
)
from db.druid.config import construct_druid_configuration
from db.druid.errors import MissingDatasourceException
from db.druid.metadata import DruidMetadata_
from db.druid.query_client import DruidQueryClient_
from db.druid.util import (
    EmptyFilter,
    build_query_filter_from_aggregations,
    get_dimension_filters,
)
from log import LOG
from web.server.data.time_boundary import DataTimeBoundary
from web.server.util.dev.static_data_query_client import StaticDataQueryClient


def build_dimension_count_aggregation(dimension: str) -> dict:
    '''This raw aggregation will count the number of rows that have a non-null value for
    the dimension provided. If the query result contains a value greater than 0 for this
    aggregation, you can be sure that at least one non-null dimension exists.
    '''
    return {
        'type': 'filtered',
        'filter': {
            'type': 'not',
            'field': {'type': 'selector', 'dimension': dimension, 'value': ''},
        },
        'aggregator': {'type': 'longMax', 'fieldName': 'count', 'name': dimension},
    }


def build_raw_druid_query(
    datasource_name: str, full_time_interval: str, dimensions: List[str]
) -> dict:
    '''Build a raw druid query that will calculate which dimensions have non-null values
    for every raw field ID in the datasource.
    '''
    return {
        'queryType': 'groupBy',
        'dataSource': datasource_name,
        'granularity': 'all',
        'intervals': [full_time_interval],
        'context': {
            # NOTE(stephen): Return results in the array-based format to improve
            # perfomance of this potentially large query (the data returned is smaller
            # than the object based result, so the network transfer is improved. Also,
            # json parsing is easier).
            'resultAsArray': True
        },
        'dimensions': [FIELD_NAME],
        'aggregations': [
            build_dimension_count_aggregation(dimension) for dimension in dimensions
        ],
    }


def build_cache(
    datasource_name: str,
    full_time_interval: str,
    dimensions: List[str],
    query_client: DruidQueryClient_,
) -> dict:
    '''Find the dimensions that are non-null for every raw field ID in the datasource.
    '''
    raw_query = build_raw_druid_query(datasource_name, full_time_interval, dimensions)

    LOG.info('Running query')
    query_result = query_client.run_raw_query(raw_query)

    LOG.info('Storing results in cache')
    # NOTE(stephen): The results are returned in the array-based format. We will need
    # to supply our own column names when interpretting the result.
    header = [FIELD_NAME, *dimensions]

    output = {}
    for row in query_result:
        field_id = row[0]
        supported_dimensions = []
        for i, dimension in enumerate(header):
            if i == 0:
                continue

            # If the row value for this dimension is greater than 0, we are guaranteed
            # to have at least one non-null value for that dimension for this field.
            if row[i] > 0:
                supported_dimensions.append(dimension)

        if field_id and supported_dimensions:
            output[field_id] = tuple(supported_dimensions)
    return output


def get_raw_fields_used_by_calculation(calculation: Calculation) -> List[str]:
    '''Find the raw field IDs referenced in any part of this calculation. Assuming that
    if the druid calculation's aggregations reference a field ID, then the calculation
    has access to that field ID.
    '''

    druid_calculation = calculation.to_druid('__unused__')
    query_filter = build_query_filter_from_aggregations(druid_calculation.aggregations)

    # TODO(stephen): I think the only times this happens is for unfiltered theta sketch
    # aggregations and `arrayOfFilteredDoublesSketch` aggregations. Enumerate these
    # possibilities so we can better understand how to represent them to the user.
    if isinstance(query_filter, EmptyFilter):
        return []

    dimension_values_referenced = get_dimension_filters(query_filter)[0]
    return dimension_values_referenced.get(FIELD_NAME, [])


def patch_complex_calculation():
    # HACK(stephen): ComplexCalculation imports the flask current_app when `to_druid` is
    # called. We don't want to stand up the full flask app just for this simple script,
    # so we essentially do what the ComplexCalculation would have done in `to_druid` to
    # create the druid calculation.
    def to_druid(self, result_id):
        druid_calculation = DruidComplexCalculation.create_from_calculation(
            CALCULATIONS_FOR_FIELD[self.calculation_id],
            new_id=result_id,
            original_id=self.calculation_id,
        )

        # While we are here, fix another edge case that only occurs with complex
        # calcs: QueryDependentAggregations can be used.
        # NOTE(stephen): If the aggregation requires information from the query to be
        # computed, just use the base aggregation. Most aggregations of this type
        # have a dependency on *time* which we do not care about.
        for agg_id in list(druid_calculation.aggregations.keys()):
            agg = druid_calculation.aggregations[agg_id]
            if isinstance(agg, QueryDependentAggregation):
                druid_calculation.aggregations[agg_id] = agg.base_aggregation
        return druid_calculation

    ComplexCalculation.to_druid = to_druid


class FieldDimensionUsageCache:
    '''Query Druid and cache the dimension IDs that are non-null for every raw field ID.
    Provide a way to get the dimension IDs that are non-null for an AQT calculation.

    NOTE(stephen): This class should *never* be used in a server context. It should only
    be used by data catalog scripts in development.
    '''

    def __init__(self, deployment_name: str, druid_host: str, dimensions: List[str]):
        LOG.info('Building raw field dimension usage cache')
        druid_configuration = construct_druid_configuration(druid_host)
        base_query_client = DruidQueryClient_(druid_configuration)
        druid_metadata = DruidMetadata_(druid_configuration, base_query_client)

        # HACK(stephen): Monkey-patch the to_druid method of ComplexCalculation to
        # avoid a flask current_app import dependency.
        patch_complex_calculation()

        # HACK(stephen): If there is no live datasource for this deployment, or if we
        # are unable to access it, skip populating the cache.
        try:
            datasource = druid_metadata.get_most_recent_datasource(deployment_name)
        except MissingDatasourceException:
            LOG.info(
                'No datasource could be found for deployment %s. Skipping',
                deployment_name,
            )
            self.cache = {}
            return

        query_client = (
            base_query_client
            if os.getenv('IS_PRODUCTION') or os.getenv('IS_TEST')
            else StaticDataQueryClient(druid_configuration, datasource, druid_metadata)
        )

        time_boundary = DataTimeBoundary(query_client, datasource)
        interval = time_boundary.get_full_time_interval()

        self.cache = build_cache(datasource.name, interval, dimensions, query_client)
        LOG.info(
            'Raw field dimension usage cache is built. Raw fields: %s', len(self.cache)
        )

    def compute_enabled_dimensions(self, calculation: Calculation) -> List[str]:
        '''Find the dimensions that have at least one non-null value when this
        calculation is queried. If the returned list is empty, we were unable to
        determine which dimensions were supported.
        '''
        # NOTE(stephen): Escape hatch for deployments that do not have an active
        # datasource (or if we were not able to connect to the deployment's Druid).
        if not self.cache:
            return []

        supported_dimensions = set()
        for raw_field_id in get_raw_fields_used_by_calculation(calculation):
            dimensions_for_raw_field = self.cache.get(raw_field_id)
            if dimensions_for_raw_field:
                supported_dimensions.update(dimensions_for_raw_field)
        return sorted(supported_dimensions)
