from config.template.aggregation import DIMENSIONS

# List of dimensions that will display in the filter dropdown and be filterable.
FILTER_DIMENSIONS = [
    *DIMENSIONS,
    'source',
]

# Dimensions that we are able to restrict querying on. As a baseline, this should be
# filled with source, and the least granular (largest geo) value
AUTHORIZABLE_DIMENSIONS = set()
