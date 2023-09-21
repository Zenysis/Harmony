############################################################################
# Datatypes

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
    MUNICIPALITY = 'MunicipalityName'

    # Yellow Fever dimensions
    SEX = 'Sex'
    AGE = 'Age'
    DEATH = 'Death'


HIERARCHICAL_DIMENSIONS = [
    Dimension.STATE,
    Dimension.MUNICIPALITY,
]
DIMENSION_PARENTS = {
    parent: HIERARCHICAL_DIMENSIONS[: parent_index + 1]
    for parent_index, parent in enumerate(HIERARCHICAL_DIMENSIONS[1:])
}
NON_HIERARCHICAL_DIMENSIONS = []


BrazilDimensionFactory = DimensionFactory(
    HIERARCHICAL_DIMENSIONS,
    NON_HIERARCHICAL_DIMENSIONS,
    RAW_PREFIX,
    CLEANED_PREFIX,
    CANONICAL_PREFIX,
)

BaseRowType = BaseRowFactory(
    Dimension, HIERARCHICAL_DIMENSIONS, DIMENSION_PARENTS, NON_HIERARCHICAL_DIMENSIONS
)
DimensionFactoryType = BrazilDimensionFactory
