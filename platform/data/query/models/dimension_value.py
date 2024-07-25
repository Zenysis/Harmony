import related

from data.query.models.query_filter import QueryFilter


@related.immutable
class DimensionValue:
    '''The DimensionValue model represents an existing dimension's value in the
    database. It contains a reference to the Dimension along with the
    QueryFilter needed to filter for that dimension's value.
    '''

    id = related.StringField()
    # Dimension id
    dimension = related.StringField()
    filter = QueryFilter.child_field()
    name = related.StringField()
    description = related.StringField('')
    subtitle = related.StringField('')
