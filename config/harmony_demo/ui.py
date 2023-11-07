import os
from config.harmony_demo.datatypes import Dimension
from config.locales import LOCALES

############################################################################
# General template UI

# Shows in top left.
FULL_PLATFORM_NAME = 'MZ Training Demo Platform'

# Classname for country flag.
FLAG_CLASS = 'flag-mz'

# Default language
DEFAULT_LOCALE = 'en'

# Translations to offer.
ENABLE_LOCALES = LOCALES.keys()

# Favicon browser icon.
FAVICON_PATH = 'favicon.png'

# Save to home icon.
HOME_ICON_PATH = 'favicon.png'

# If set, LOGO_PATH overrides the flag shown at the top of the navbar.
LOGO_PATH = None

############################################################################
# Query Form UI

# Whether to show Ethiopian date selector.
ENABLE_ET_DATE_SELECTION = False

############################################################################
# Timeseries UI

# Whether to show Ethiopian dates instead of Gregorian dates on timeseries.
TIMESERIES_USE_ET_DATES = False

# The default time granularity the timeseries should use.
TIMESERIES_DEFAULT_GRANULARITY = 'month'

############################################################################
# Map UI

# Two letter ISO country code
COUNTRY_CODE = 'mz'

# Center of map view.
# NOTE(vinh): This is centered over Tamboni right now.
MAP_DEFAULT_LATLNG = [-16.5598187, 36.1220383]

# Default zoom level.
MAP_DEFAULT_ZOOM = 6.0

MAP_GEOJSON_LOCATION = (
    'https://dvvivclrsb6tx.cloudfront.net/mz/geojson/mozambique-20210714.geojson'
)

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
DQL_MAP_DIMENSIONS = [Dimension.PROVINCE, Dimension.DISTRICT]

# Mapbox access token.
MAPBOX_ACCESS_TOKEN = os.environ['MAPBOX_ACCESS_TOKEN']

############################################################################
# Misc
# New user google form
FEED_BACK_REGISTRATION_LINK = None

# Give users a link/tab for data quality
ENABLE_DATA_QUALITY_LAB = True

# Session timeout in seconds
SESSION_TIMEOUT = 1800

# Up to nine custom colors for the deployment
CUSTOM_COLORS = []
