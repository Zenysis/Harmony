#!/usr/bin/env python
from collections import defaultdict
import sys

from data.query_policy.query_policy import (
    add_single_policy,
    get_distinct_values_for_dimension,
    get_policy_type_enum,
)
from log import LOG
from models.alchemy.query_policy import QueryPolicy
from util.local_script_wrapper import local_main_wrapper
from web.server.data.data_access import Transaction

# NOTE: To fix flask import issues
# pylint: disable=C0412
# pylint: disable=W0611
from models.alchemy.user.model import UserAcl
from models.alchemy.security_group.model import GroupAcl
from models.alchemy.dashboard.model import Dashboard


def main():
    '''Check the query policies are accurate for all authorizable dimensions
    aka that there are no extraneous ones and none are missing. This script
    does not address any of these issues, just logs them.
    '''
    # NOTE defer importing config so if deployment_name is specified then it's not
    # required at all
    # pylint: disable=import-outside-toplevel
    from config.filters import AUTHORIZABLE_DIMENSIONS

    missing_policies = defaultdict(list)
    extra_policies = defaultdict(list)

    with Transaction() as transaction:
        for dimension in AUTHORIZABLE_DIMENSIONS:
            # We're assuming every all value policy follows the naming convention
            policy_type_enum = get_policy_type_enum(dimension)

            # Fetch all policies of that type
            existing_policies = transaction.find_all_by_fields(
                QueryPolicy, {'query_policy_type_id': policy_type_enum.value}
            )
            # Filter to policies matching this dimension and get their names
            existing_policy_values = {
                policy.dimension_value
                for policy in existing_policies
                if dimension == policy.dimension
            }
            distinct_dimension_values = set(
                get_distinct_values_for_dimension(dimension)
            )

            # Store any policies that should exist, but don't
            for missing_policy in distinct_dimension_values - existing_policy_values:
                missing_policies[dimension].append(missing_policy)
            if None not in existing_policy_values:
                missing_policies[dimension].append(None)

            # Store any policies that do exist, but aren't linked to any data in druid
            for extra_policy in existing_policy_values - distinct_dimension_values:
                if extra_policy is not None:
                    extra_policies[dimension].append(extra_policy)

        for dimension, extra_vals in extra_policies.items():
            LOG.error(
                'Dimension %s has the following query policies that do not exist in druid: %s',
                dimension,
                ', '.join(extra_vals),
            )

        if extra_policies:
            if missing_policies:
                for dimension, missing_vals in missing_policies.items():
                    LOG.info(
                        'Dimension %s does not have the following policies that exist in druid: %s',
                        dimension,
                        ', '.join(missing_vals),
                    )
                # NOTE: If a dimension value or source has been renamed, then
                # we do not want to duplicate the query policy and create a new one.
                # In that case, user access would not be properly transferred. Instead,
                # the existing policy should be edited.
                LOG.error(
                    'Missing policies cannot be added while there are extraneous policies. '
                    'Should any be edited?'
                )
            return 1

        for dimension, missing_vals in missing_policies.items():
            LOG.info('Adding missing query policies for dimension %s', dimension)
            policy_type_enum = get_policy_type_enum(dimension)
            for missing_val in missing_vals:
                add_single_policy(transaction, policy_type_enum, dimension, missing_val)
                LOG.info('Created query policy for "%s"', missing_val or 'All values')
    LOG.info('All policies are up to date!')
    return 0


if __name__ == '__main__':
    sys.exit(local_main_wrapper(main))
