import related
from pydruid.utils.filters import Filter

from data.query.models.query_filter.query_filter import QueryFilter


@related.immutable
class RawFilter(QueryFilter):
    '''A simple wrapper model for any underlying druid filter
    '''

    filter = related.ChildField(Filter)
    type = related.StringField('SIMPLE')

    def to_druid(self):
        return self.filter
