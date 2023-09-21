from itertools import chain

from pydruid.utils.filters import Dimension

from config.druid_base import DEFAULT_DRUID_INTERVAL, SOURCE_NAME
from db.druid.errors import MissingDatasourceException
from db.druid.query_builder import GroupByQueryBuilder
from db.druid.query_client import DruidQueryClient
from models.alchemy.query_policy import QueryPolicy, QueryPolicyTypeEnum
from web.server.query.util import COUNT_CALCULATION


def get_policy_type_enum(dimension):
    return (
        QueryPolicyTypeEnum.DATASOURCE
        if dimension == SOURCE_NAME
        else QueryPolicyTypeEnum.DIMENSION
    )


def get_distinct_values_for_dimension(dimension_name):
    # NOTE: Not best practice but no way of knowing if there's a
    # datasource other than connect to it
    try:
        from config.database import DATASOURCE

        base_query = GroupByQueryBuilder(
            datasource=DATASOURCE.name,
            granularity='all',
            grouping_fields=[dimension_name],
            intervals=DEFAULT_DRUID_INTERVAL,
            calculation=COUNT_CALCULATION,
        )
        # pylint: disable=C0121
        base_query.query_filter &= Dimension(dimension_name) != None
        query_result = DruidQueryClient.run_query(base_query)
        return [item['event'][dimension_name] for item in query_result.result]
    except MissingDatasourceException:
        print('ERROR: No datasource for this deployment')
        return []


def add_single_policy(transaction, query_policy_enum, dimension_name, dimension_value):
    transaction.add_or_update(
        QueryPolicy(
            dimension=dimension_name,
            dimension_value=dimension_value,
            query_policy_type_id=query_policy_enum.value,
        )
    )
