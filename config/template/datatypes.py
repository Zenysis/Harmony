############################################################################
# Datatypes

from pylib.base.flags import Flags

from data.pipeline.datatypes.base_row import BaseRow
from data.pipeline.datatypes.base_row_factory import BaseRowFactory
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


HIERARCHICAL_DIMENSIONS = [Dimension.STATE, Dimension.DISTRICT, Dimension.FACILITY]
DIMENSION_PARENTS = {
    parent: HIERARCHICAL_DIMENSIONS[: parent_index + 1]
    for parent_index, parent in enumerate(HIERARCHICAL_DIMENSIONS[1:])
}


# pylint: disable=invalid-name
TemplateCamelNameDimensionFactory = DimensionFactory(
    HIERARCHICAL_DIMENSIONS, [], RAW_PREFIX, CLEANED_PREFIX, CANONICAL_PREFIX
)

BaseRowType = BaseRowFactory(Dimension, HIERARCHICAL_DIMENSIONS, DIMENSION_PARENTS)
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
