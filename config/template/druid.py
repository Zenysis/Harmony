import global_config

from config.druid_base import FIELD_NAME
from config.template.aggregation import (
    DIMENSIONS,
    DIMENSION_ID_MAP,
    GEO_TO_LATLNG_FIELD,
)
from config.template.datatypes import BaseRowType
from config.template.filters import FILTER_DIMENSIONS


def build_druid_dimensions():
    '''Build the list of dimensions that will exist in Druid after indexing data. This
    includes all user-visible dimensions (from config.aggregation) and all
    internal dimensions (like lat/lon).
    '''
    dimension_set = set(
        [
            BaseRowType.DATE_FIELD,
            BaseRowType.SOURCE_FIELD,
            FIELD_NAME,
            *DIMENSIONS,
            *DIMENSION_ID_MAP.values(),
        ]
    )
    for lat_lon_fields in GEO_TO_LATLNG_FIELD.values():
        dimension_set.update(lat_lon_fields)

    # Return the dimensions in sorted order so that the representation is always
    # stable.
    return sorted(dimension_set)


# The list of dimensions that will exist in Druid after indexing.
DIMENSIONS = build_druid_dimensions()

# The list of dimensions that will never need to be filtered on in a Druid query and can
# be stored in a more optimal way during indexing.
UNFILTERABLE_DIMENSIONS = [
    d for pieces in GEO_TO_LATLNG_FIELD.values() for d in pieces
] + list(set(DIMENSIONS) - set(FILTER_DIMENSIONS))

DRUID_HOST = global_config.AWS_DRUID_HOST
