import os

MODULE_PATHS = [
    # Top Level
    '',
    # Directories
    'calculated_indicator_defs',
    'calculated_indicator_defs.calculated_indicator_defs',
    # Files
    'aggregation_rules',
    'aggregation',
    'calculated_indicators',
    'case_management',
    'chat',
    'data_status',
    'datatypes',
    'druid',
    'filters',
    'general',
    'indicators',
    'pipeline_sources',
    'ui',
]


def get_configuration_module():
    try:
        from flask import current_app

        if current_app:
            return current_app.zen_config
    except ImportError:
        pass

    return import_configuration_module()


def import_configuration_module(zenysis_environment=None):
    zenysis_environment = zenysis_environment or os.getenv('ZEN_ENV')
    configuration_module = __import__(
        'config.{environment}'.format(environment=zenysis_environment),
        fromlist=MODULE_PATHS,
    )
    return configuration_module
