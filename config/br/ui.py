from config.br.aggregation import DIMENSION_PARENTS

############################################################################
# General template UI

# Shows in top left.
FULL_PLATFORM_NAME = 'Zenysis Data Analytics Platform'

# Classname for country flag.
FLAG_CLASS = 'flag-br'

# Default language
DEFAULT_LOCALE = 'en'

# Translations to offer.
ENABLE_LOCALES = ['en']

# Favicon browser icon.
FAVICON_PATH = '/images/favicon.png'

# Save to home icon.
HOME_ICON_PATH = '/images/favicon.png'

# If set, LOGO_PATH overrides the flag shown at the top of the navbar.
LOGO_PATH = None

# Non-Unique lowest level geos mapped to the next geo type in the hierarchy.
GEO_NAME_MAP = {}
SHOW_INDICATOR_NOTES = False

############################################################################
# Query Form UI

# Order in which to display filters defined in filters.py.
# TODO(ian): Enable these after some work on frontend to make SelectFilter
# support filtering everything. For now, just enable geo filters.
FILTER_ORDER = ['geography']

# If you want all groups (except ones that default as hidden)
# to appear in the dropdown set `'groupIds': []`
# If you want to add a dropdown, make sure to add its labels to
# the locales translations files, and the selectionType to the Fields class.
QUERY_FORM_DROPDOWNS = [
    {'selectionType': 'healthIndicators', 'filterOn': 'healthIndicator', 'groupIds': []}
]

LEGACY_FIELD_OPTIONS = {'fields': 'field', 'denominator': 'denominator'}
FIELD_OPTIONS = {
    drop['selectionType']: drop['filterOn'] for drop in QUERY_FORM_DROPDOWNS
}
FIELD_OPTIONS.update(LEGACY_FIELD_OPTIONS)

# Whether to show date range of data in the list of selected indicators.
SHOW_SELECTION_DATE_RANGES = True

# Left-to-right order.
SELECT_GRANULARITY_BUTTON_ORDER = ['MunicipalityName', 'StateName', 'nation']

# Default toggle button selection.
SELECT_GRANULARITY_DEFAULT_LEVEL = 'MunicipalityName'

# Whether to show Ethiopian date selector.
ENABLE_ET_DATE_SELECTION = False

# Date picker to show. Strings are defined in web/client/selection_util.js
DEFAULT_DATE_PICKER_TYPE = 'CUSTOM'

# Default dashboard filter panel components to enable.
DEFAULT_FILTER_OPTIONS = ['filters', 'dates', 'display_by']

############################################################################
# Timeseries UI

# Whether to show Ethiopian dates instead of Gregorian dates on timeseries.
TIMESERIES_USE_ET_DATES = False

# The default time granularity the timeseries should use.
TIMESERIES_DEFAULT_GRANULARITY = 'month'

############################################################################
# Table UI

# Extra columns to include in the table. These are inserted after the first
# primary dimension column in the table view.
TABLE_COLUMNS = DIMENSION_PARENTS

# Map from backend response field to table display name.
TABLE_COLUMNS_DISPLAY_MAP = {}

############################################################################
# Map UI

# Two letter ISO country code
COUNTRY_CODE = 'br'

# Center of map view.
MAP_DEFAULT_LATLNG = [-14.2350, -51.9253]

# Default zoom level.
MAP_DEFAULT_ZOOM = 4

# GeoJson Tile Overlay
MAP_GEOJSON_LOCATION = 'https://d2ke70b3fbr0dr.cloudfront.net/brazil_20190807.geojson'

# Static geo data locations.
GEO_DATA_URL = ''
# Dimension and the children dimensions for geo data.
GEO_DATA_DIMENSIONS = ''
# List of keys to be displayed.
GEO_DATA_DISPLAY = []
# The key to use to display a value in the map labels (for entity markers only).
# This will change if we decide to show multiple values per entity.
GEO_DATA_LABEL_KEY = ''

# A model that represents settings associated with our GIS tool. This stores
# information such as dataset URLs, names of datasets, keys to filter on, etc.
GIS_APP_SETTINGS = None

# List of geo dimensions that can be shown on the dql map viz
DQL_MAP_DIMENSIONS = ['StateName']

# Mapbox Admin url boundaries.
MAP_MAPBOX_ADMIN_URLS = {}

# Mapbox access token.
MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiaWFudyIsImEiOiJjaWY4dnNkeTIwOWMzczlseHVxZDJqNTM1In0.XIkCSEq_oLlAiXT5FfABFw'

############################################################################
# Misc
# New user google form
FEED_BACK_REGISTRATION_LINK = None

# User manual link in nav menu.
USER_MANUAL_URL = None

# Give users a link/tab for data quality
ENABLE_DATA_QUALITY_LAB = True

# Session timeout in seconds
SESSION_TIMEOUT = 1800

# Up to nine custom colors for the deployment
CUSTOM_COLORS = []

# Whether this is a "Harmony" deployment. If true, will disable some features.
IS_HARMONY = False
