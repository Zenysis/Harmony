from config.template.datatypes import HIERARCHICAL_DIMENSIONS

# Geography filter dimensions are required. They are hierarchical, ordered from
# biggest to smallest.
_GEOGRAPHY_FILTER_DIMENSIONS = ['_all'] + HIERARCHICAL_DIMENSIONS

FRONTEND_CACHED_FILTER_DIMENSIONS = _GEOGRAPHY_FILTER_DIMENSIONS

# Map from filter ID to an ordered list of dimensions that will display in the
# filter dropdown.
FILTER_DIMENSIONS = {'geography': _GEOGRAPHY_FILTER_DIMENSIONS}

# Configuration of filters for public portal.
PUBLIC_FILTER_DIMENSIONS = {}

# Dimensions that we are able to restrict querying on
AUTHORIZABLE_DIMENSIONS = set()
