# -*- coding: utf-8 -*-
from enum import Enum
from config.br.aggregation import DIMENSION_PARENTS, GEO_FIELD_ORDERING
from data.pipeline.datatypes.base_row import BaseRow
from data.pipeline.datatypes.dimension_factory import DimensionFactory

# Output field information
RAW_PREFIX = 'Raw'
CLEANED_PREFIX = 'Clean'
CANONICAL_PREFIX = 'Canonical'

HIERARCHICAL_DIMENSIONS = GEO_FIELD_ORDERING


class BaseBrRow(BaseRow):
    # These are the fields that will be used in the matching process
    # They are ordered by granularity
    MAPPING_KEYS = GEO_FIELD_ORDERING
    PARENT_LEVELS = DIMENSION_PARENTS
    UNMAPPED_KEYS = []

    # TODO(stephen, ian): allow passing of data in constructor
    def __init__(
        self, region='', state='', capital='', municipality='', date='', source=''
    ):
        # TODO(vinh): Figure out what we want to do with capital vs municipality.
        key = {
            'RegionName': region,
            'StateName': state,
            'CapitalName': capital,
            'MunicipalityName': municipality,
        }
        super(BaseBrRow, self).__init__(key, {}, date, source)

    @classmethod
    def from_dict(cls, stored_instance):
        output = cls()
        output._internal = stored_instance
        return output


BrazilDimensionFactory = DimensionFactory(
    HIERARCHICAL_DIMENSIONS, [], RAW_PREFIX, CLEANED_PREFIX, CANONICAL_PREFIX
)

BaseRowType = BaseBrRow
DimensionFactoryType = BrazilDimensionFactory


class LocationTypeEnum(Enum):
    NATION = 1
    STATE = 2
    MUNICIPALITY = 3


LOCATION_TYPES = set([location_type.name for location_type in LocationTypeEnum])
