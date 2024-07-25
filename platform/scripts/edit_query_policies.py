#!/usr/bin/env python
from functools import partial
import os
import re
import sys
from typing import List, Tuple

from pylib.base.flags import Flags
from pylib.base.term_color import TermColor

from config.filters import AUTHORIZABLE_DIMENSIONS
from data.query_policy.query_policy import (
    get_policy_type_enum,
)
from db.postgres.common import get_db_session
from log import LOG
from models.alchemy.query_policy import (
    QueryPolicy,
    QueryPolicyRole,
    QueryPolicyTypeEnum,
)
from web.server.data.data_access import Transaction

# NOTE: To fix flask import issues
# pylint: disable=C0412
# pylint: disable=W0611
from models.alchemy.user.model import UserAcl
from models.alchemy.security_group.model import GroupAcl
from models.alchemy.dashboard.model import Dashboard


# For the given list of policies to edit, edit the name, description, policy_filters
# fields to reflect to new name of the dimension.
def edit_policies(
    transaction: Transaction,
    dimension_from_druid: str,
    policy_type_enum: QueryPolicyTypeEnum,
    policies_to_edit: List[Tuple[str, str]],
) -> None:
    # Build a lookup from old name to new name. Fetch relevant query policies.
    rename_policies_map = {}
    for policy_dim_vals in policies_to_edit:
        old_dim_val, new_dim_val = policy_dim_vals
        rename_policies_map[old_dim_val] = new_dim_val
    existing_policies = (
        transaction.run_raw()
        .query(QueryPolicy)
        .filter(
            QueryPolicy.query_policy_type_id == policy_type_enum.value,
            QueryPolicy.dimension == dimension_from_druid,
            QueryPolicy.dimension_value.in_(rename_policies_map.keys()),
        )
    )

    # Loop through all query policies. Determine whether they need to be edited
    # and, if so, edit them.
    updated_policies = []
    for policy in existing_policies:
        updated_policies.append(
            {
                'id': policy.id,
                'dimension_value': rename_policies_map[policy.dimension_value],
            }
        )

    # Bulk save them back to the db.
    transaction.run_raw().bulk_update_mappings(QueryPolicy, updated_policies)
    LOG.info(
        f'Edited {len(updated_policies)} query policies for {dimension_from_druid}'
    )


# For the given list of policy pairs to merge, add the second policy in the pair to
# all roles that have access to the first policy. Then delete the first policy.
def merge_policies(
    transaction: Transaction,
    dimension_from_druid: str,
    policy_type_enum: QueryPolicyTypeEnum,
    policies_to_merge: List[Tuple[str, str]],
) -> None:
    # Build a lookup from the first query policy name (that is being deleted) to
    # the second query policy name (that is being kept).
    merge_policies_map = {}
    for policy_names in policies_to_merge:
        to_delete_dim_val, to_keep_dim_val = policy_names
        merge_policies_map[to_delete_dim_val] = to_keep_dim_val
    # Fetch all relevant query policies.
    policies_lookup = {
        policy.dimension_value: policy
        for policy in transaction.find_all_by_fields(
            QueryPolicy,
            {
                'dimension': dimension_from_druid,
                'query_policy_type_id': policy_type_enum.value,
            },
        )
    }

    query_policy_role_mappings_to_create = []
    query_policies_to_delete = []
    for to_delete_name, to_keep_name in merge_policies_map.items():
        # Skip policies that don't exist.
        if to_delete_name not in policies_lookup:
            LOG.info(
                f'ERROR: Could not find query policy "{to_delete_name}" under {dimension_from_druid}'
            )
            continue
        if to_keep_name not in policies_lookup:
            LOG.info(
                f'ERROR: Could not find query policy "{to_keep_name}" under {dimension_from_druid}'
            )
            continue

        policy_to_delete = policies_lookup[to_delete_name]
        policy_to_keep = policies_lookup[to_keep_name]
        existing_role_ids = {role.id for role in policy_to_keep.roles}
        for role in policy_to_delete.roles:
            # If both the old query policy that's being removed and the one
            # that is being kept have a role, then nothing needs to be done.
            if role.id in existing_role_ids:
                continue

            # If the old query policy that's being removed has a role the query
            # policy that is being kept does not have, then add that role to the
            # kept query policy.
            query_policy_role_mappings_to_create.append(
                QueryPolicyRole(query_policy_id=policy_to_keep.id, role_id=role.id)
            )
            LOG.info(
                f'Adding "{policy_to_keep.name}" query policy to role "{role.label}"'
            )

        query_policies_to_delete.append(policy_to_delete)

    # Bulk save the new role mappings to the db and then delete the query policies.
    transaction.run_raw().bulk_save_objects(query_policy_role_mappings_to_create)
    for query_policy in query_policies_to_delete:
        transaction.delete(query_policy)
    LOG.info(
        f'Deleted {len(query_policies_to_delete)} query policies for {dimension_from_druid}'
    )


RE_SEPARATOR = re.compile(r'[^\\]:')
RE_UNQUOTE = re.compile(r'\\:')
unescape = partial(RE_UNQUOTE.sub, ':')


def validate_policy_dim_values(parser, values: List[str]) -> List[Tuple[str, str]]:
    """
    Validates that dimension value arguments can be split into pairs and de-escapes
    colons in them, returns them as paired-tuples.
    """
    results: List[Tuple[str, str]] = []
    for value in values:
        sep_match = RE_SEPARATOR.search(value)
        # There should be exactly one odd number of `:` for value to be unambiguous
        if not sep_match or RE_SEPARATOR.search(value, sep_match.end() - 1):
            parser.error(
                f'Error parsing "{value}": two values should be given separated by a '
                'colon. If value itself contains a colon, it should be escaped with \\. '
                "For example, 'Fruit\\:Ananas':'Fruit\\:Pineapple'."
            )
            sys.exit(1)
        sep_idx = sep_match.end() - 1
        results.append((unescape(value[:sep_idx]), unescape(value[sep_idx + 1 :])))
    return results


def main():
    '''Generate query policies for dimension values and sources.
    Script is idempotent - it checks existence of a particular policy before
    creation.

    Script functionality is highly dependent on Flags that are passed in.
    --deployment_name: Give deployment name or omit for value in $DATABASE_URL
    --dimension_from_druid: Fetches dimension from latest datasource inferred
        from $ZEN_ENV. Fills in the all_<dimension_name> value as well.
    '''
    Flags.PARSER.add_argument(
        '--deployment_name',
        type=str,
        required=False,
        help=(
            'Name of the deployment to generate alerts. If not provided, '
            'defaults to local db'
        ),
    )
    Flags.PARSER.add_argument(
        '--dimension_from_druid',
        type=str,
        required=True,
        default='',
        help=('Dimension name to be loaded from Druid',),
    )
    Flags.PARSER.add_argument(
        '--edit_policies',
        nargs='*',
        type=str,
        default=[],
        required=False,
        help='If given a list of policies to rename like oldName:newName, will ONLY edit those '
        'policies. It will change the name, description, and policy filters. Requires '
        '`--dimension_from_druid` to also be set to define which dimension to rename.',
    )
    Flags.PARSER.add_argument(
        '--merge_policies',
        nargs='*',
        type=str,
        default=[],
        required=False,
        help='If given a list of policies to merge like name1:name2, it will merge '
        'name1 into name2 and delete name1. This should be used when name1 is being '
        'removed as a value in the platform and combined with name2. The "merging" '
        'process is query policy name2 will be added to any roles that only had query '
        'policy name1. If toDeleteName or toKeepName don\'t exist, nothing will be '
        'done. Requires `--dimension_from_druid` to also be set to define which '
        'dimension to rename.',
    )
    Flags.InitArgs()
    deployment_name = Flags.ARGS.deployment_name

    dimension_from_druid = Flags.ARGS.dimension_from_druid
    policies_to_edit = validate_policy_dim_values(
        Flags.PARSER, Flags.ARGS.edit_policies
    )
    policies_to_merge = validate_policy_dim_values(
        Flags.PARSER, Flags.ARGS.merge_policies
    )

    deployment_code = os.getenv('ZEN_ENV')
    LOG.info(TermColor.ColorStr(f"Using deployment code: {deployment_code}.", 'GREEN'))
    reply = input("To continue, type 'y'\n")
    if reply != 'y':
        return 1

    # First check against AUTHORIZABLE_DIMENSIONS
    if dimension_from_druid not in AUTHORIZABLE_DIMENSIONS:
        LOG.info('ERROR: provided dimension must have dimension filters enabled')
        return 0

    session = get_db_session(deployment_name, deployment_code)
    with Transaction(get_session=lambda: session) as transaction:
        policy_type_enum = get_policy_type_enum(dimension_from_druid)

        if policies_to_edit:
            edit_policies(
                transaction,
                dimension_from_druid,
                policy_type_enum,
                policies_to_edit,
            )

        if policies_to_merge:
            merge_policies(
                transaction,
                dimension_from_druid,
                policy_type_enum,
                policies_to_merge,
            )

        if policies_to_edit or policies_to_merge:
            return 0
    Flags.PARSER.error('Should select an action: edit or merge')
    return 1


if __name__ == '__main__':
    sys.exit(main())
