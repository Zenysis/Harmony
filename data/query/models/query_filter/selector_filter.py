import related

from pydruid.utils.filters import Dimension as DimensionFilter

from data.query.models.query_filter.query_filter import QueryFilter


@related.immutable
class SelectorFilter(QueryFilter):
    '''The SelectorFilter model represents a filtering of a specific value for a
    dimension.
    '''

    # Dimension id
    dimension = related.StringField()
    value = related.StringField()
    type = related.StringField('SELECTOR')

    def to_druid(self):
        return DimensionFilter(self.dimension) == self.value


QueryFilter.register_subtype(SelectorFilter)
