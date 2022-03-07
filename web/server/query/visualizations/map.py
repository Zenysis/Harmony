from typing import List, Optional

from pydruid.utils.filters import Dimension as DimensionFilter

from web.server.query.visualizations.base import QueryBase, TIMESTAMP_COLUMN
from web.server.query.visualizations.map_util import (
    build_admin_boundary_restriction,
)
from web.server.query.visualizations.util import build_key_column

LAT_FIELD = 'lat'
LNG_FIELD = 'lng'
ZERO_VAL = '0.0'


def build_map_data_point_generator(dimension_names, numeric_fields, lat_lng_fields):
    '''Build a dynamic class that DataFrame.to_dict can use to convert the
    dataframe's intermediary format into the MapDataPoint format.
    '''
    (lat_field, lng_field) = lat_lng_fields or (None, None)

    class MapDataPoint(dict):
        def __init__(self, values):
            raw_dict = dict(values)
            dimensions = {}
            for dimension in dimension_names:
                dimensions[dimension] = raw_dict[dimension]

            metrics = {}
            for field in numeric_fields:
                metrics[field] = raw_dict[field]

            lat = 0
            lng = 0
            raw_lat = raw_dict.get(lat_field)
            raw_lng = raw_dict.get(lng_field)
            if raw_lat and raw_lat != ZERO_VAL:
                lat = raw_lat
            if raw_lng and raw_lng != ZERO_VAL:
                lng = raw_lng

            super(MapDataPoint, self).__init__(
                {
                    'dimensions': dimensions,
                    'metrics': metrics,
                    'key': raw_dict['key'],
                    LAT_FIELD: lat,
                    LNG_FIELD: lng,
                }
            )

    return MapDataPoint


def get_most_granular_dimension(dimension_list, mappable_dimension_priority):
    '''
    Returns the most granular dimension in dimension_list described in
    geo_field_ordering. Mappable dimensions that do not exist in
    geo_field_ordering take precedence over those that do exist.
    If none are found, return None
    '''
    if dimension_list:
        for dimension_name in mappable_dimension_priority:
            if dimension_name in dimension_list:
                return dimension_name
    return None


def build_map_response(
    df, dimension_names, numeric_fields, lat_lng_fields, nation_name
):
    data = []
    if not df.empty:
        data_point_generator = build_map_data_point_generator(
            dimension_names, numeric_fields, lat_lng_fields
        )
        data = df.to_dict('records', data_point_generator)

    # Specifically for a query with grouped by Nation
    if len(data) == 1 and data[0]['key'] == 'All':
        data[0]['key'] = nation_name
        data[0][LAT_FIELD] = 0
        data[0][LNG_FIELD] = 0

    return {'data': data}


def compute_mappable_dimension_priority(geo_field_ordering, geo_to_lat_lng):
    # The mappable dimension priority order is:
    # - All dimensions that are mappable that *do not* exist in GEO_FIELD_ORDERING
    # - All dimensions in GEO_FIELD_ORDERING from most granular to least granular.
    # Prefer mappable dimensions that are not in GEO_FIELD_ORDERING since
    # GEO_FIELD_ORDERING generally represents a hierarchy and not all mappable
    # dimensions fit in that hierarchy.

    return [
        mappable_dimension
        for mappable_dimension in list(geo_to_lat_lng.keys())
        if mappable_dimension not in geo_field_ordering
    ] + geo_field_ordering[::-1]


class Map(QueryBase):
    '''Class to process the pandas dataframe returned from a druid query into
    the format needed for the map visualization.
    '''

    mappable_dimension_priority: Optional[List[str]] = None

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
        geo_dimensions = self.geo_to_lat_lng.get(self._geo_dimension, {})
        if self._geo_dimension and geo_dimensions:
            self._lat_lng_fields = list(geo_dimensions)

            # NOTE(toshi, stephen): Drop all non-geo dimensions from the map
            # query since they are not currently supported. Add in dimension
            # parents so that geoKey can be generated properly (for shape tiles
            # support).
            self._dimension_names = self.dimension_parents.get(
                self._geo_dimension, []
            ) + [self._geo_dimension]

    def build_query(self):
        query = self.request.to_druid_query(self.datasource.name)

        # Always clear the subtotal config since we cannot actually draw subtotals on
        # the map (they won't have a lat/lon).
        query.subtotals = None

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

        # filter out fully empty columns. pandas throws an error if you try to
        # include them as an axis to join on
        dimensions_to_join_on = list(
            filter(lambda col: raw_df[col].notnull().any(), self._dimension_names)
        )

        # Add a 'key' column so that the grouped dimensions can be represented
        # in a single string to display on the frontend. The key is based off
        # the most granular geo dimension.
        label_dimensions = None if not self._geo_dimension else [self._geo_dimension]
        label_df = build_key_column(
            raw_df, 'key', dimensions_to_join_on, label_dimensions
        )

        return raw_df.join(label_df, on=dimensions_to_join_on)

    def build_response(self, df):
        '''Output records for geo.'''
        numeric_fields = [field.id for field in self.request.fields]

        data = []
        if not df.empty:
            dates = sorted(df[TIMESTAMP_COLUMN].unique())

            for date in dates:
                dated_df = df[df['timestamp'] == date]
                dated_data = build_map_response(
                    dated_df,
                    self._dimension_names,
                    numeric_fields,
                    self._lat_lng_fields,
                    self.nation_name,
                )

                dated_dict = {'date': date, 'datedData': dated_data['data']}

                data.append(dated_dict)

        # Have the backend pass a restriction for the admin boundaries based on the
        # user's query. These lists will contain locations to include or exclude based
        # on the filter the user applied to the query.
        (include_filters, exclude_filters) = build_admin_boundary_restriction(
            self.request.filter, set(self.geo_field_ordering)
        )

        return {
            'adminBoundaryExcludeLocations': exclude_filters,
            'adminBoundaryIncludeLocations': include_filters,
            'data': data,
        }
