import related

from pydruid.utils.filters import Dimension as DimensionFilter

from data.query.models.category import Category
from db.druid.util import EmptyFilter


@related.immutable
class Dimension:
    '''The Dimension model represents a queryable dimension in the database.'''

    id = related.StringField()
    name = related.StringField('')
    category = related.ChildField(Category, required=False)
    description = related.StringField('')

    def to_druid(self):
        return self.id


@related.immutable
class GroupingDimension:
    '''
    The GroupingDimension model wraps a Dimension instance and provides
    additional query-specific features.
    `include_all` means that we will attempt to include all dimension values for this
    dimension in the query result, even if they would normally have been filtered out
    for having no data. ***This will significantly hurt query performance***.
    `include_null` means null values for the wrapped dimension should be
    included in the query result.
    `include_total` means a total value should be calculated at query time for
    the wrapped dimension and included in the results.
    '''

    # Dimension id
    dimension = related.StringField()
    include_all = related.BooleanField(False, key='includeAll')
    include_null = related.BooleanField(True, key='includeNull')
    include_total = related.BooleanField(False, key='includeTotal')

    def to_druid_filter(self):
        if self.include_null:
            return EmptyFilter()
        return DimensionFilter(self.dimension) != ''
