from config.template.datatypes import DIMENSION_PARENTS, HIERARCHICAL_DIMENSIONS

############################################################################
# GeoTimeAggregator settings

# Geo fields from least specific to most specific.
GEO_FIELD_ORDERING = HIERARCHICAL_DIMENSIONS

# Given a query on a field, which fields should we ask Druid for?
# Unless otherwise specified, querying on a field will just ask for itself.
DIMENSION_SLICES = {
    dimension: [dimension] + parents for dimension, parents in DIMENSION_PARENTS.items()
}

DIMENSION_PARENTS = DIMENSION_PARENTS

# When the server starts, query for distinct values along these dimensions and
# build a geo hierarchy in memory.  Used to populate geo filter dropdown.
DISTINCT_GEOS_TO_QUERY = HIERARCHICAL_DIMENSIONS

DIMENSION_ID_MAP = {
    dimension: dimension.replace('Name', 'ID') for dimension in HIERARCHICAL_DIMENSIONS
}

DIMENSION_ID_ORDERING = [
    DIMENSION_ID_MAP[dimension] for dimension in HIERARCHICAL_DIMENSIONS
]

# Map from whereType API query param to latlng fields.
GEO_TO_LATLNG_FIELD = {
    dimension: (dimension.replace('Name', 'Lat'), dimension.replace('Name', 'Lon'))
    for dimension in HIERARCHICAL_DIMENSIONS
}

# List of queryable dimensions. Ordered to allow deterministic
# key generation
DIMENSIONS = []
DIMENSIONS.extend(GEO_FIELD_ORDERING)

# Dimension category mapping from parent name to list of dimensions. Used by AQT.
DIMENSION_CATEGORIES = [('Geography', GEO_FIELD_ORDERING)]

# NOTE(stephen): Right now this must match the druid granularity IDs.
ENABLED_GRANULARITIES = ['month', 'quarter', 'year']

# The granularities that we allow uses the filter by in the AQT frontend.
# Sometimes this varies from ENABLED_GRANULARITIES due to AQT style queries
# being run in other parts of the APP (e.g. Data Quality).
AQT_ENABLED_GRANULARITIES = ['month', 'quarter', 'year']

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


def get_data_key(data):
    '''Generate a unique aggregation key for a given set of data based
    on the location the data is representing.'''
    # NOTE(stephen): Need to OR with an empty string since the data object
    # can actually contain None as a value which breaks string operations
    return '__'.join([(data.get(f) or '') for f in GEO_FIELD_ORDERING]).lower()
