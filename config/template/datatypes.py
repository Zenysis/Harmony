############################################################################
# Datatypes

from enum import Enum
from pylib.base.flags import Flags

from data.pipeline.datatypes.base_row import BaseRow
from data.pipeline.datatypes.dimension_factory import DimensionFactory

# Output field information
RAW_PREFIX = 'Raw'
CLEANED_PREFIX = 'Clean'
CANONICAL_PREFIX = 'Canonical'


class Dimension:
    SOURCE = (BaseRow.SOURCE_FIELD,)
    DATE = (BaseRow.DATE_FIELD,)
    STATE = 'StateName'
    DISTRICT = 'DistrictName'
    FACILITY = 'FacilityName'


class LocationTypeEnum(Enum):
    NATION = 1
    STATE = 2
    DISTRICT = 3
    FACILITY = 4


LOCATION_TYPES = set(location_type.name for location_type in LocationTypeEnum)

HIERARCHICAL_DIMENSIONS = [Dimension.STATE, Dimension.DISTRICT, Dimension.FACILITY]
DIMENSION_PARENTS = {
    Dimension.DISTRICT: [Dimension.STATE],
    Dimension.FACILITY: [Dimension.STATE, Dimension.DISTRICT],
}


class BaseTemplateCamelNameRow(BaseRow):
    # These are the fields that will be used in the matching process
    # They are ordered by granularity
    MAPPING_KEYS = HIERARCHICAL_DIMENSIONS
    PARENT_LEVELS = DIMENSION_PARENTS
    UNMAPPED_KEYS = []


# pylint: disable=invalid-name
TemplateCamelNameDimensionFactory = DimensionFactory(
    HIERARCHICAL_DIMENSIONS, [], RAW_PREFIX, CLEANED_PREFIX, CANONICAL_PREFIX
)

BaseRowType = BaseTemplateCamelNameRow
DimensionFactoryType = TemplateCamelNameDimensionFactory


class PipelineArgs:
    @classmethod
    def add_source_processing_args(cls):
        Flags.PARSER.add_argument(
            '--output_file', type=str, required=True, help='Processed data output file'
        )
        Flags.PARSER.add_argument(
            '--location_list',
            type=str,
            required=True,
            help='Output list of region/district/facility for matching',
        )
        Flags.PARSER.add_argument(
            '--field_list',
            type=str,
            required=True,
            help='Output list of all possible fields with data for this source',
        )
