import related

from pydruid.utils.filters import Dimension as DimensionFilter

from config.druid_base import FIELD_NAME
from data.query.models.query_filter.query_filter import QueryFilter


@related.immutable
class FieldFilter(QueryFilter):
    '''The FieldFilter model represents a filter for a specific field ID.

    NOTE(stephen): Intentionally not pointing to a Field model to avoid
    circular dependencies with calculations during deserialization.
    '''

    field_id = related.StringField(key='fieldId')
    type = related.StringField('FIELD')

    def to_druid(self):
        return DimensionFilter(FIELD_NAME) == self.field_id


QueryFilter.register_subtype(FieldFilter)
