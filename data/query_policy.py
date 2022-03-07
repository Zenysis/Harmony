from pydruid.utils.filters import Dimension

from db.druid.errors import MissingDatasourceException
from db.druid.query_builder import GroupByQueryBuilder
from db.druid.query_client import DruidQueryClient
from models.alchemy.query_policy import QueryPolicy
from web.server.data.status import INTERVAL
from web.server.data.dimension_values import COUNT_CALCULATION

DESCRIPTION_TEMPLATE = 'Allows policy holder to access data for %s; value: %s'


def get_all_value_policy_name(dimension_name):
    return f'All {dimension_name}s'


def get_distinct_values_for_dimension(dimension_name):
    # HACK(toshi): Not best practice but no way of knowing if there's a
    # datasource other than connect to it
    try:
        from config.database import DATASOURCE

        base_query = GroupByQueryBuilder(
            datasource=DATASOURCE.name,
            granularity='all',
            grouping_fields=[dimension_name],
            intervals=INTERVAL,
            calculation=COUNT_CALCULATION,
        )
        # pylint: disable=C0121
        base_query.query_filter &= Dimension(dimension_name) != None
        query_result = DruidQueryClient.run_query(base_query)
        return [item['event'][dimension_name] for item in query_result.result]
    except MissingDatasourceException:
        print('ERROR: No datasource for this deployment')
        return []


# pylint: disable=C0103
def seed_dimension_query_policies_via_druid(
    transaction, dimension_name, query_policy_enum
):
    '''Seeds a dimension with policies fetched from druid. Also populates the
    ALL query policy with an all_dimensions query policy
    '''
    existing_policies = transaction.find_all_by_fields(
        QueryPolicy, {'query_policy_type_id': query_policy_enum.value}
    )
    existing_policy_names = set(policy.name for policy in existing_policies)
    # distinct_dimension_values = get_distinct_values_for_dimension(dimension_name)
    distinct_dimension_values = []

    for distinct_dimension_value in distinct_dimension_values:
        if distinct_dimension_value in existing_policy_names:
            print(f'"{distinct_dimension_value}" is an existing policy.')
            continue

        policy_filter = {
            dimension_name: {
                'includeValues': [distinct_dimension_value],
                'excludeValues': [],
                'allValues': False,
            }
        }
        transaction.add_or_update(
            QueryPolicy(
                name=distinct_dimension_value,
                description=DESCRIPTION_TEMPLATE
                % (dimension_name, distinct_dimension_value),
                policy_filters=policy_filter,
                query_policy_type_id=query_policy_enum.value,
            )
        )
        print(f'Created query policy for {distinct_dimension_value}')

    # Populate the all case as well. We can check for existence by searching for
    # a query policy that has allValues populated
    all_dimension_policy = None
    for policy in existing_policies:
        (policy_dimension_name, policy_filter) = next(
            iter(policy.policy_filters.items())
        )
        # We need to check dimension_name for deployments with multi-non source
        # query policies
        if policy_dimension_name == dimension_name and policy_filter['allValues']:
            all_dimension_policy = policy

    all_values_name = get_all_value_policy_name(dimension_name)
    if all_dimension_policy:
        if all_dimension_policy.name != all_values_name:
            # Update this to new name
            all_dimension_policy.name = all_values_name
            transaction.add_or_update(all_dimension_policy)
            print(f'Updated {all_values_name} policy for {dimension_name}')
        else:
            print(f'{all_values_name} policy already exists for {dimension_name}')
    else:
        policy_filter = {
            dimension_name: {
                'includeValues': [],
                'excludeValues': [],
                'allValues': True,
            }
        }
        transaction.add_or_update(
            QueryPolicy(
                name=all_values_name,
                description=DESCRIPTION_TEMPLATE % (dimension_name, 'ALL'),
                policy_filters=policy_filter,
                query_policy_type_id=query_policy_enum.value,
            )
        )
        print(f'Created query policy for {all_values_name}')
