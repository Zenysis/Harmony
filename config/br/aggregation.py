from config.br.datatypes import DIMENSION_PARENTS, HIERARCHICAL_DIMENSIONS, Dimension
from models.python.config.calendar_settings import CalendarSettings

# Geo fields from least specific to most specific.
GEO_FIELD_ORDERING = HIERARCHICAL_DIMENSIONS

# Given a query on a field, which fields should we ask Druid for?
# Unless otherwise specified, querying on a field will just ask for itself.
DIMENSION_SLICES = {
    dimension: [dimension] + parents for dimension, parents in DIMENSION_PARENTS.items()
}

DIMENSION_CATEGORIES = [
    ('Geography', GEO_FIELD_ORDERING),
    ('Yellow Fever', [Dimension.AGE, Dimension.SEX, Dimension.DEATH]),
]

DIMENSION_ID_MAP = {
    dimension: dimension.replace('Name', 'ID') for dimension in HIERARCHICAL_DIMENSIONS
}

# Map from whereType API query param to latlng fields.
GEO_TO_LATLNG_FIELD = {
    dimension: (dimension.replace('Name', 'Lat'), dimension.replace('Name', 'Lon'))
    for dimension in HIERARCHICAL_DIMENSIONS
}

# List of queryable dimensions.
DIMENSIONS = [
    dimension for _, dimensions in DIMENSION_CATEGORIES for dimension in dimensions
]

CALENDAR_SETTINGS = CalendarSettings.create_default()
