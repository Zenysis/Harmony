from models.python.config.calendar_settings import CalendarSettings

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

# Map from whereType API query param to lat, lng fields.
# TODO(ian): This should be renamed because dimensions are not just geos
# anymore.
GEO_TO_LATLNG_FIELD = {
    'MunicipalityName': ('MunicipalityLat', 'MunicipalityLon'),
    'CapitalName': ('CapitalLat', 'CapitalLon'),
    'StateName': ('StateLat', 'StateLon'),
}

# List of queryable dimensions.
DIMENSIONS = [
    dimension for _, dimensions in DIMENSION_CATEGORIES for dimension in dimensions
]

CALENDAR_SETTINGS = CalendarSettings.create_default()

# Mapping from Dimension ID to a comparator for sorting a list of dimensions,
# and a display ID used by the frontend to communicate what sort is being used
BACKEND_SORTS = {}

# Generate a unique aggregation key for a given set of data based
# on the location the data is representing,
def get_data_key(data):
    # NOTE(stephen): Need to OR with an empty string since the data object
    # can actually contain None as a value which breaks string operations
    return '__'.join([(data.get(f) or '') for f in DIMENSIONS]).lower()
