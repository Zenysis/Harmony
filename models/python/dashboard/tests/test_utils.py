from models.python.dashboard.version import (
    NEXT_SCHEMA_VERSION_MAP,
    VERSION_TO_UPGRADE_FUNCTION,
)


def upgrade_spec_to_current(specification, current_version):
    '''Upgrades the spec to the current version'''
    version = specification['version']
    while version < current_version:
        specification = VERSION_TO_UPGRADE_FUNCTION[version](specification)
        version = NEXT_SCHEMA_VERSION_MAP[version]
    return specification
