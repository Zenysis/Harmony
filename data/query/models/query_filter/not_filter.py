import related

from data.query.models.query_filter.query_filter import QueryFilter


@related.immutable
class NotFilter(QueryFilter):
    '''The NotFilter represents the negation of the specified QueryFilter.'''

    field = QueryFilter.child_field()
    type = related.StringField('NOT')

    def to_druid(self):
        return ~self.field.to_druid()


QueryFilter.register_subtype(NotFilter)
