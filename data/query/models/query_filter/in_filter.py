import related

from pydruid.utils.filters import Filter

from data.query.models.query_filter.query_filter import QueryFilter


@related.immutable
class InFilter(QueryFilter):
    '''The InFilter represents a filtering of values IN the specified dimension.'''

    # Dimension id
    dimension = related.StringField()
    values = related.SequenceField(str)
    type = related.StringField('IN')

    def to_druid(self):
        return Filter(type='in', dimension=self.dimension, values=list(self.values))


QueryFilter.register_subtype(InFilter)
