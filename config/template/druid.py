import global_config

from config.druid_base import FIELD_NAME
from config.template.aggregation import (
    DIMENSIONS,
    DIMENSION_ID_MAP,
    GEO_TO_LATLNG_FIELD,
)
from config.template.datatypes import BaseRowType


def get_dimensions_list():
    # TODO(ian): This is a different way to reproduce
    # config.aggregation.DIMENSIONS

    ret = [BaseRowType.DATE_FIELD, BaseRowType.SOURCE_FIELD, FIELD_NAME]

    ret.extend(DIMENSIONS)
    ret.extend(list(DIMENSION_ID_MAP.values()))

    for latlng_fields in list(GEO_TO_LATLNG_FIELD.values()):
        if latlng_fields:
            ret.extend(latlng_fields)
    return list(set(ret))


DIMENSIONS = get_dimensions_list()

# Extra metrics to compute during druid indexing
EXTRA_METRICS = []

DRUID_HOST = global_config.DEFAULT_DRUID_HOST
