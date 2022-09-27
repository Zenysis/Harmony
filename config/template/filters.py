from config.template.aggregation import DIMENSIONS
from config.template.datatypes import BaseRowType

# Dimensions that should not be filterable for users
EXCLUDE_FILTER_DIMENSIONS = set()

# Dimensions that we are able to restrict querying on
AUTHORIZABLE_DIMENSIONS = set()

# List of dimensions that will display in the filter dropdown and be filterable.
FILTER_DIMENSIONS = (
    set(DIMENSIONS) - EXCLUDE_FILTER_DIMENSIONS + AUTHORIZABLE_DIMENSIONS
)
