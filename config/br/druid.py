import global_config
from config.druid_base import FIELD_NAME
from config.br.aggregation import DIMENSIONS, GEO_FIELD_ORDERING, GEO_TO_LATLNG_FIELD
from config.br.datatypes import BaseBrRow


def get_dimensions_list():
    ret = [BaseBrRow.DATE_FIELD, BaseBrRow.SOURCE_FIELD, FIELD_NAME]

    ret.extend(GEO_FIELD_ORDERING)

    for latlng_fields in list(GEO_TO_LATLNG_FIELD.values()):
        if latlng_fields:
            ret.extend(latlng_fields)
    ret.extend(DIMENSIONS)

    return list(set(ret))


DIMENSIONS = get_dimensions_list()

# Extra metrics to compute during druid indexing
EXTRA_METRICS = []

DRUID_HOST = global_config.DEFAULT_DRUID_HOST
