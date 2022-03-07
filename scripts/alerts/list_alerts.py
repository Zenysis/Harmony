from typing import List, Optional, TypedDict
import sys

import pandas as pd
from pylib.base.term_color import TermColor

from db.postgres.common import get_db_session
from scripts.cli_util.list_deployments import (
    is_deployment_name_valid,
)
from web.server.data.data_access import Transaction

# Need to import these models since they are referenced by the `User` model
# pylint:disable=W0611
from models.alchemy.alerts import AlertDefinition
from models.alchemy.dashboard import Dashboard
from models.alchemy.permission import Resource
from models.alchemy.query_policy import QueryPolicyRole
from models.alchemy.security_group import GroupAcl
from models.alchemy.user import User, UserAcl


class AlertInfo(TypedDict):
    dimension_name: str
    number_filters: int
    time_granularity: str
    title: str
    user_email: str


def get_alerts_list(
    deployment_name: Optional[str] = None,
) -> List[AlertInfo]:
    '''Get a list of all alerts associated with a deployment

    Args:
        deployment_name (str, optional): the deployment name (if fetching remotely)

    Returns:
        List[AlertInfo]
    '''

    db_session = get_db_session(deployment_name)
    with Transaction(get_session=lambda: db_session) as transaction:
        alert_definitions = transaction.find_all(AlertDefinition)
        alerts: List[AlertInfo] = [
            {
                'title': row.title,
                'dimension_name': row.dimension_name,
                'time_granularity': row.time_granularity,
                'number_filters': len(row.filters),
                'user_email': row.author_username,
            }
            for row in alert_definitions
        ]

    return alerts


def list_alerts(
    deployment_name: str = None,
    out: Optional[str] = None,
) -> List[AlertInfo]:
    '''List all the alerts associated with a given deployment.

    Args:
        deployment_name (str, optional): a valid deployment name
        out (str, optional): The file to write the CSV output to

    Returns:
        List[AlertInfo]
    '''
    if not is_deployment_name_valid(deployment_name, print_help=True):
        sys.exit(1)

    deployment_to_run = deployment_name or ''
    print(TermColor.ColorStr(f"Fetching all alerts from {deployment_to_run}", 'GREEN'))

    alerts = get_alerts_list(deployment_to_run)

    # using pandas because they have a really nice way of printing tables
    df = pd.DataFrame(alerts)

    # add 1 to the index column just to make the first row print as 1 instead of 0
    df.index += 1
    print(
        TermColor.ColorStr(
            df.to_string(
                max_colwidth=75,
            ),
            'AUQA',
        )
    )

    if out:
        # pylint:disable=W1514
        with open(out, 'w') as out_file:
            df.to_csv(out_file)
        print(TermColor.ColorStr(f'Wrote CSV output to {out}', 'GREEN'))

    return alerts
