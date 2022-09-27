from config.br.aggregation import DIMENSIONS
from config.br.datatypes import BaseRowType, Dimension

# Dimensions that should not be filterable for users
EXCLUDE_FILTER_DIMENSIONS = set()

# Dimensions that we are able to restrict querying on
AUTHORIZABLE_DIMENSIONS = {BaseRowType.SOURCE_FIELD, Dimension.STATE}

# List of dimensions that will display in the filter dropdown and be filterable.
FILTER_DIMENSIONS = (
    set(DIMENSIONS) - EXCLUDE_FILTER_DIMENSIONS + AUTHORIZABLE_DIMENSIONS
)
