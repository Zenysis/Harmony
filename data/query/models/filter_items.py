import related

from data.query.models.query_filter import OrFilter, NotFilter


@related.immutable
class BaseFilterItem:
    id = related.StringField()
    # Dimension id

    def build_filter(self):
        filter_ = self._build_filter()
        # NOTE (sergey) see comments for `invert` in successor classes
        # pylint: disable=no-member
        if self.invert:
            return NotFilter(field=filter_)
        return filter_

    def _build_filter(self):
        raise NotImplementedError('Should be definied in subclasses')


# TODO: Switch the backend DashboardSpec model to use them QueryFilterItem
@related.immutable
class DimensionValueFilterItem(BaseFilterItem):
    '''The DimensionValueFilterItem model represents a filter on a dimension.
    It contains a reference to the Dimension and list of DimensionValues.
    '''

    dimension = related.StringField()
    dimension_values = related.SequenceField(
        'data.query.models.DimensionValue',
        [],
        required=False,
        key='dimensionValues',
    )
    # NOTE this invert field should go to `BaseFilterItem` but I think that
    # it's a bug in `related` that does not let it to be there
    invert = related.BooleanField(required=False)

    def _build_filter(self):
        if len(self.dimension_values) == 1:
            return self.dimension_values[0].filter
        return OrFilter(fields=map(lambda dv: dv.filter, self.dimension_values))


@related.immutable
class CustomizableTimeIntervalFilterItem(BaseFilterItem):
    filter = related.ChildField('data.query.models.query_filter.IntervalFilter')
    # NOTE this invert field should go to `BaseFilterItem` but I think that
    # it's a bug in `related` that does not let it to be there
    invert = related.BooleanField(required=False)

    def _build_filter(self):
        return self.filter
