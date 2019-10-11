import functools
from past.utils import old_div
from web.server.query.visualizations.base import BaseVisualization
from web.server.query.visualizations.util import build_key_column

# Return the sort ID to use and a mapping from key to sort index
# TODO(stephen, ian): If this is going to stay around, it might make sense
# for the config to handle sort function returning
def build_backend_sort_order(df, dimensions, backend_sort_map):
    backend_sort_column = get_backend_sort_column(dimensions, backend_sort_map)
    if not backend_sort_column:
        return (None, None)

    backend_sort = backend_sort_map[backend_sort_column]
    ordered_keys = sorted(df[backend_sort_column].unique(), key=functools.cmp_to_key(backend_sort['fn']))

    output = {}
    for i, key in enumerate(ordered_keys):
        output[key] = i
    return (backend_sort['id'], output)


def get_backend_sort_column(dimensions, backend_sort_map):
    # Backend sort order for multiple dimensions (or no dimensions, ie.
    # a nation query) is not supported.
    if len(dimensions) != 1 or not backend_sort_map:
        return None

    column = dimensions[0]
    return column if column in backend_sort_map else None


class BarGraph(BaseVisualization):
    '''Bar graph visualization endpoint.

    Extra request param:
      labelDimensions: list of dimensions to build the x axis key from
    '''

    def __init__(self, request, query_client, backend_sort_map, show_nation_in_results):
        super(BarGraph, self).__init__(request, query_client)
        # The user should specify which dimensions will be used as the label
        # for the output values. Default to the requested dimensions if not
        # specified.
        self._label_dimensions = request.get('labelDimensions') or self.dimensions
        self.show_nation_in_results = show_nation_in_results
        self.backend_sort_map = backend_sort_map

    def build_df(self, df):
        ''' Create a key column as a column separated list of the requested
        label dimensions. If no label dimensions are specified, use a default
        value as the key.
        Example: 'key' is the row index and,
        df.columns = [RegionName, WoredaName, field_1, field_1_count, field_1_sum, ...].'''
        if df.empty:
            return df

        # TODO(stephen): If no dimensions are grouped on, there should only be
        # one row returned. Validate this.
        if not self.dimensions:
            df['key'] = 'Nation'
            return df

        # Add a 'key' column so that the grouped dimensions can be represented
        # in a single string to display on the frontend. The key is based off
        # the label dimensions.
        label_df = build_key_column(df, 'key', self.dimensions, self._label_dimensions)
        return df.join(label_df, on=self.dimensions)

    # Output data is stored as a list of SingleBars, with a bar being
    # built for each output field requested
    def build_response(self, df):
        data = []
        totals = {}
        if not df.empty:
            columns = ['key'] + self.numeric_fields
            data = df[columns].to_dict('records')
            offset = 1.0 if not self._has_nation_hack() else 2.0
            for field in self.numeric_fields:
                totals[field] = old_div(df[field].sum(), offset)

            (sort_id, sort_order) = self._build_backend_sort_order(df)
            if sort_order:
                for row in data:
                    row[sort_id] = sort_order[row['key']]

        return {'data': data, 'fields': self.numeric_fields, 'totals': totals}

    def _build_backend_sort_order(self, df):
        return build_backend_sort_order(df, self.dimensions, self.backend_sort_map)

    # HACK(stephen): Exclude the ET nation-as-region hack from the totals.
    def _has_nation_hack(self):
        if self.show_nation_in_results:
            if len(self.dimensions) == 1 and self.dimensions[0] == 'RegionName':
                return True
        return False
