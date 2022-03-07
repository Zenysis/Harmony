import related

from data.query.models.query_filter.query_filter import QueryFilter
from db.druid.util import EmptyFilter


@related.immutable
class AndFilter(QueryFilter):
    '''The AndFilter represents the AND operation applied over a list of QueryFilters.
    '''

    fields = QueryFilter.sequence_field()
    type = related.StringField('AND')

    def to_druid(self):
        output = EmptyFilter()
        for field in self.fields:
            output &= field.to_druid()
        return output

    def is_valid(self) -> bool:
        return all([f.is_valid() for f in self.fields])


QueryFilter.register_subtype(AndFilter)
