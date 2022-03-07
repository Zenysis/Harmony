import related

from pydruid.utils.filters import Filter

from config.druid_base import FIELD_NAME
from data.query.models.query_filter.query_filter import QueryFilter


@related.immutable
class FieldInFilter(QueryFilter):
    '''The FieldInFilter model represents an IN filter for a specific set of field IDs.

    NOTE(stephen): Intentionally not pointing to a Field model to avoid circular
    dependencies with calculations during deserialization. Also avoiding creating Field
    as a Dimension because we don't want to expose that publicly.
    '''

    field_ids = related.SequenceField(str, key='fieldIds')
    type = related.StringField('FIELD_IN')

    def to_druid(self):
        return Filter(type='in', dimension=FIELD_NAME, values=list(self.field_ids))


QueryFilter.register_subtype(FieldInFilter)
