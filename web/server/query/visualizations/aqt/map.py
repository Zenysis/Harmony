from pydruid.utils.filters import Dimension as DimensionFilter

from web.server.query.visualizations.aqt.aqt_base import AQTBase, TIMESTAMP_COLUMN
from web.server.query.visualizations.map import (
    build_map_response,
    compute_mappable_dimension_priority,
    get_most_granular_dimension,
)
from web.server.query.visualizations.util import build_key_column


class Map(AQTBase):
    ''' Class to process the pandas dataframe returned from a druid query into
    the format needed for the map visualization.
    '''

    mappable_dimension_priority = None

    def __init__(
        self,
        request,
        query_client,
        datasource,
        dimension_parents,
        geo_to_lat_lng,
        geo_field_ordering,
        nation_name,
    ):
        super(Map, self).__init__(request, query_client, datasource)
        self.dimension_parents = dimension_parents
        self.geo_to_lat_lng = geo_to_lat_lng
        self.geo_field_ordering = geo_field_ordering
        self.nation_name = nation_name
        self._lat_lng_fields = []
        self._dimension_names = self.grouping_dimension_ids()

        if not Map.mappable_dimension_priority:
            Map.mappable_dimension_priority = compute_mappable_dimension_priority(
                self.geo_field_ordering, self.geo_to_lat_lng
            )

        # NOTE(toshi): Since multiple dimensions can be selected in the query,
        # we need to find the most granular dimension to display map values for.
        self._geo_dimension = get_most_granular_dimension(
            self._dimension_names, Map.mappable_dimension_priority
        )
        if self._geo_dimension:
            self._lat_lng_fields = list(
                self.geo_to_lat_lng.get(self._geo_dimension, [])
            )

            # NOTE(toshi, stephen): Drop all non-geo dimensions from the map
            # query since they are not currently supported. Add in dimension
            # parents so that geoKey can be generated properly (for shape tiles
            # support).
            self._dimension_names = self.dimension_parents.get(
                self._geo_dimension, []
            ) + [self._geo_dimension]

    def build_query(self):
        query = self.request.to_druid_query(self.datasource.name)
        # If there are no geo dimensions to query, do nothing.
        if not self._geo_dimension:
            return query

        # Set the dimensions to query to be only mappable dimensions and the associated
        # lat/lng dimensions.
        query.dimensions = self._dimension_names + self._lat_lng_fields

        # Need to filter out null values for the granular geo dimension chosen.
        query.query_filter &= DimensionFilter(self._geo_dimension) != ''
        return query

    def build_df(self, raw_df):
        if raw_df.empty:
            return raw_df

        if not self.grouping_dimension_ids():
            raw_df['key'] = 'All'
            return raw_df

        # Add a 'key' column so that the grouped dimensions can be represented
        # in a single string to display on the frontend. The key is based off
        # the most granular geo dimension.
        label_dimensions = None if not self._geo_dimension else [self._geo_dimension]
        label_df = build_key_column(
            raw_df, 'key', self._dimension_names, label_dimensions
        )
        return raw_df.join(label_df, on=self._dimension_names)

    def build_response(self, df):
        '''Output records for geo.
        '''
        numeric_fields = [field.id for field in self.request.fields]

        data = []
        dates = sorted(df[TIMESTAMP_COLUMN].unique())

        for date in dates:
            datedDf = df[df['timestamp'] == date]
            datedData = build_map_response(
                datedDf,
                self._dimension_names,
                numeric_fields,
                self._lat_lng_fields,
                self.nation_name,
            )

            datedDict = {'date': date, 'datedData': datedData['data']}

            data.append(datedDict)

        return {'data': data}
