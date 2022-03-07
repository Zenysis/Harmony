import related

# TODO(abby): Fully flesh out models for QueryFilterItem and switch the backend DashboardSpec
# model to use them
@related.immutable
class DimensionValueFilterItem:
    '''The DimensionValueFilterItem model represents a filter on a dimension.
    It contains a reference to the Dimension and list of DimensionValues.
    '''

    id = related.StringField()
    # Dimension id
    dimension = related.StringField()
    dimension_values = related.SequenceField(
        'data.query.models.DimensionValue',
        [],
        required=False,
        key='dimensionValues',
    )
    invert = related.BooleanField(False, required=False)
