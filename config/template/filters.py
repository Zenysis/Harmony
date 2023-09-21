from config.template.aggregation import DIMENSIONS

# Dimensions that should not be filterable for users
EXCLUDE_FILTER_DIMENSIONS = set()

# List of dimensions that will display in the filter dropdown and be filterable.
# Include the source dimension and any others in AQT, exclude the dimensions
# that aren't filterable.
FILTER_DIMENSIONS = {'source', *DIMENSIONS} - EXCLUDE_FILTER_DIMENSIONS

# Dimensions that we are able to restrict querying on. As a baseline, this should be
# filled with source, and the least granular (largest geo) value
AUTHORIZABLE_DIMENSIONS = set()
