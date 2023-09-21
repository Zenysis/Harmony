#!/usr/bin/env python

import os
from typing import Optional

from db.postgres.common import get_db_session
from models.alchemy.configuration import Configuration

# I have to import this model since it is referenced by the `Configuration` model
from models.alchemy.dashboard import Dashboard  # pylint:disable=W0611
from models.alchemy.permission import Resource  # pylint:disable=W0611
from models.alchemy.query_policy import QueryPolicy  # pylint:disable=W0611
from models.alchemy.security_group import GroupUsers  # pylint:disable=W0611
from models.alchemy.user import User  # pylint:disable=W0611
from web.server.data.data_access import Transaction

LATEST_DATASOURCE = 'LATEST_DATASOURCE'
CUR_DATASOURCE_KEY = 'cur_datasource'


def get_cur_datasource_from_db(deployment: Optional[str]):
    deployment_code = os.getenv('ZEN_ENV', '')
    session = get_db_session(
        deployment_name='' if deployment is None else deployment,
        deployment_code=deployment_code,
    )

    with Transaction(get_session=lambda: session) as transaction:
        entity: Optional[Configuration] = transaction.find_one_by_fields(
            entity_class=Configuration,
            case_sensitive=True,
            search_fields={'key': CUR_DATASOURCE_KEY},
        )
        if entity and entity.overwritten is True:
            if entity.overwritten_value == LATEST_DATASOURCE:
                return None
            return str(entity.overwritten_value)

    return None
