############################################################################
# GeoTimeAggregator settings

# Geo fields from least specific to most specific.
GEO_FIELD_ORDERING = ['StateName', 'MunicipalityName']

# When the server starts, query for distinct values along these dimensions and
# build a geo hierarchy in memory.  Used to populate geo filter dropdown.
DISTINCT_GEOS_TO_QUERY = ['StateName', 'MunicipalityName']

# Given a query on a field, which fields should we ask Druid for?
# Unless otherwise specified, querying on a field will just ask for itself.
DIMENSION_SLICES = {
    'MunicipalityName': ['MunicipalityName', 'StateName'],
    'StateName': ['StateName'],
}

DIMENSION_PARENTS = {'MunicipalityName': ['StateName']}

DIMENSION_CATEGORIES = [('Geography', GEO_FIELD_ORDERING)]

DIMENSION_ID_MAP = {'StateName': 'StateID', 'MunicipalityName': 'MunicipalityID'}
# NOTE(stephen): Right now this must match the druid granularity IDs.
ENABLED_GRANULARITIES = ['day', 'month', 'quarter', 'year']

# The granularities that we allow uses the filter by in the AQT frontend.
# Sometimes this varies from ENABLED_GRANULARITIES due to AQT style queries
# being run in other parts of the APP (e.g. Data Quality).
AQT_ENABLED_GRANULARITIES = ['month', 'quarter', 'year']

# Map from whereType API query param to lat, lng fields.
# TODO(ian): This should be renamed because dimensions are not just geos
# anymore.
GEO_TO_LATLNG_FIELD = {
    'MunicipalityName': ('MunicipalityLat', 'MunicipalityLon'),
    'CapitalName': ('CapitalLat', 'CapitalLon'),
    'StateName': ('StateLat', 'StateLon'),
    'nation': None,
}

# List of queryable dimensions. Ordered to allow deterministic
# key generation
DIMENSIONS = ['MunicipalityName', 'StateName']

DIMENSION_ID_ORDERING = ['MunicipalityName']

# Function with a method signature (start_date, end_date, granularity) that will
# generate the set of date intervals for the given granularity within the
# start and end date interval supplied. It is useful when the granularity
# desired does not line up with a builtin granularity in druid.
GRANULARITY_BUCKETING_FN = None

# The start month of this deployment's fiscal calendar. A value of 1 (January) means
# the fiscal calendar matches the Gregorian calendar directly and no special treatment
# is needed.
FISCAL_START_MONTH = 1

# Mapping from Dimension ID to a comparator for sorting a list of dimensions,
# and a display ID used by the frontend to communicate what sort is being used
BACKEND_SORTS = {}

# Generate a unique aggregation key for a given set of data based
# on the location the data is representing,
def get_data_key(data):
    # NOTE(stephen): Need to OR with an empty string since the data object
    # can actually contain None as a value which breaks string operations
    return '__'.join([(data.get(f) or '') for f in DIMENSIONS]).lower()
