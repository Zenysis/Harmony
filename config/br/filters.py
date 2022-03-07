# Geography filter dimensions are required. They are hierarchical, ordered from
# biggest to smallest.
_GEOGRAPHY_FILTER_DIMENSIONS = ['_all', 'StateName', 'MunicipalityName']

# Map from filter ID to an ordered list of dimensions that will display in the
# filter dropdown.
FILTER_DIMENSIONS = {
    'geography': _GEOGRAPHY_FILTER_DIMENSIONS,
    # Non-geo filters go below.
    # ...
    'source': ['_all', 'source'],
}

# Configuration of filters for public portal.
PUBLIC_FILTER_DIMENSIONS = {}

# Dimensions that we are able to restrict querying on
AUTHORIZABLE_DIMENSIONS = set(['source', 'StateName'])
