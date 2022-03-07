from typing import Any, Dict, Optional
from flask import current_app

from web.server.configuration.settings import (
    get_configuration,
    CASE_MANAGEMENT_APP_NAME,
    CASE_MANAGEMENT_HOME_PAGE_DASHBOARD,
    ENABLE_CASE_MANAGEMENT,
)

# TODO(pablo): 'default_time_filter' is not a descriptive name. Currently it is
# only relevant for Case Management instances that use alerts, and it's just
# the default time filter to apply on the frontend in the AlertsSummary block.
# TODO(pablo): also this shouldn't be here. This should be handled via an admin
# configuration
CMA_DEPLOYMENT_SETTINGS = {
    'ke': {'default_time_filter': 'allTime'},
    'mz': {'default_time_filter': 'today'},
    'mz_covid': {'default_time_filter': 'today'},
    'za': {'default_time_filter': 'allTime'},
}


def get_case_management_options(deployment_name) -> Optional[Dict[str, Any]]:
    '''Gets CaseManagementApp options.
    Returns:
        An object with configurations.
    '''
    is_enabled = get_configuration(ENABLE_CASE_MANAGEMENT)

    if not is_enabled:
        return {'appEnabled': False}

    case_management_config = current_app.zen_config.case_management
    navbar_title = get_configuration(CASE_MANAGEMENT_APP_NAME)
    home_page_dash_slug = get_configuration(CASE_MANAGEMENT_HOME_PAGE_DASHBOARD)

    return {
        'appEnabled': True,
        # NOTE(pablo): set this to False when a deployment needs to
        # have this app hidden from the navbar.
        # TODO(pablo): this should be handled via admin configs
        'showInNavbar': True,
        'navbarTitle': navbar_title,
        'dateDisplay': 'YYYY-MM-DD',
        'datasetMap': getattr(case_management_config, 'DATASETS', {}),
        'deploymentSettings': CMA_DEPLOYMENT_SETTINGS.get(deployment_name, {}),
        'homePageDashboardSlug': home_page_dash_slug,
    }
