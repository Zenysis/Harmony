#!/usr/bin/env python
import json
from collections import defaultdict
from typing import Dict, List, Optional, Set

import requests

from config.loader import import_configuration_module
from db.druid.config import DruidConfig
from db.druid.metadata import DruidMetadata
from log import LOG
from util.druid import get_druid_request_params

QUESTION_STR = (
    'Are you okay with disabling these datasources? This cannot '
    'be reverted (yes/no): '
)

# Keyword to use if all datasources want to be processed.
ALL_KEYWORD = 'all'


def get_datasources_map():
    '''Returns a mapping of deployments to datasources.

    Returns:
        A map of deployments to datasources. For example:

        {
            'alliance_india': ['alliance_india_20190416', 'alliance_india_20190417'],
            'lr': ['lr_20190421', 'lr_20190422']
        }
    '''
    datasources = DruidMetadata.get_site_datasources()
    datasources_map = defaultdict(list)
    for datasource in datasources:
        datasources_map[datasource.site].append(datasource.name)
    return datasources_map


def get_datasources_to_disable(
    datasources_map: Dict[str, List[str]],
    deployments_to_disable: List[str],
    amount_to_keep: int,
    datasources_to_ignore: Optional[List[str]],
) -> List[List[str]]:
    '''Retrieves list of datasources to be disabled.

    Args:
        datasources_map: A map of deployment names to their respective
        datasource.
        datasources_to_disable: A list of datasources to disable.
        amount_to_keep: The amount of datasources for each deployment to keep.
        datasources_to_ignore: A list of datasources to ignore.

    Return:
        datasources_to_disable: A list of datasources to be disabled.
    '''
    datasources_to_ignore = datasources_to_ignore or []
    datasources_to_disable = []
    if deployments_to_disable[0] == ALL_KEYWORD:
        deployments_to_disable = list(datasources_map.keys())
    for deployment in deployments_to_disable:
        env_config = import_configuration_module(deployment)
        pinned_datasources: Set[str] = env_config.druid.DRUID_DATASOURCES_TO_PRESERVE

        deployment_datasources = sorted(datasources_map[deployment])
        if datasources_to_ignore or pinned_datasources:
            deployment_datasources = [
                i
                for i in deployment_datasources
                if i not in datasources_to_ignore and i not in pinned_datasources
            ]
            LOG.info(
                'Datasources to ignore %s',
                datasources_to_ignore + list(pinned_datasources),
            )

        if len(deployment_datasources) <= amount_to_keep:
            LOG.warning(
                'Amount of datasources is less than or equal to the '
                'amount to keep (%d). Skipping this deployment: %s',
                amount_to_keep,
                deployment,
            )
            continue
        datasources_to_disable.append(deployment_datasources[:-amount_to_keep])
    return datasources_to_disable


def disable_datasources(
    datasources_to_disable='', amount_to_keep=2, force=False, cur_datasources=None
):
    '''Handles the process of disabling active datasources.

    Args:
        datasources_to_disable: A list of datasources to be disabled.
        force: Force disable all datasources from datasources_to_disable
            without prompt.
        amount_to_keep: For each deployment, this is how many datasources
            the script should keep.
        force: Boolean value to determine whether the function should
            ask for permission to delete the datasources.
        cur_datasources: List of currently pinned datasources that should be
            kept.
    '''
    datasources_map = get_datasources_map()
    deployments_to_disable = datasources_to_disable.split(' ')
    amount_to_keep = int(amount_to_keep)
    # NOTE: I'd want to keep this at 2 to be safe until this proves to be
    # efficient.
    assert amount_to_keep >= 2, 'Required amount of datasources is at least 2.'
    datasources_to_disable = get_datasources_to_disable(
        datasources_map, deployments_to_disable, amount_to_keep, cur_datasources
    )
    if not datasources_to_disable:
        LOG.info('No datasources to disable. Exiting!')
        return
    LOG.info('Beginning to disable datasources...')
    LOG.info('Datasources to disable: %s', json.dumps(datasources_to_disable, indent=2))
    if not force:
        reply = input(f'{QUESTION_STR}').lower().strip()
        if reply != 'yes':
            LOG.info('Exiting with no datasources being disabled.')
            return
    druid_endpoint = DruidConfig.segment_metadata_endpoint()
    extra_params = get_druid_request_params(DruidConfig)
    for deployment in datasources_to_disable:
        for datasource in deployment:
            LOG.info('Beginning to disable %s', datasource)
            requests.delete(
                f'{druid_endpoint}/{DruidMetadata.DATASOURCE_SOURCES}/{datasource}',
                **extra_params,
            )
            LOG.info('Finished disabling %s', datasource)
