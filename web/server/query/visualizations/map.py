from web.server.query.visualizations.base import BaseVisualization
from web.server.query.visualizations.util import build_key_column

LAT_FIELD = 'lat'
LNG_FIELD = 'lng'
ZERO_VAL = '0.0'


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


class Map(BaseVisualization):
    '''Map visualization endpoint.
    '''

    mappable_dimension_priority = None

    def __init__(
        self, request, query_client, geo_to_lat_lng, geo_field_ordering, nation_name
    ):
        super(Map, self).__init__(request, query_client)

        self._dimension_names = list(self.dimensions)
        self.geo_to_lat_lng = geo_to_lat_lng
        self.geo_field_ordering = geo_field_ordering
        self.nation_name = nation_name

        if not Map.mappable_dimension_priority:
            Map.mappable_dimension_priority = compute_mappable_dimension_priority(
                self.geo_field_ordering, self.geo_to_lat_lng
            )

        # NOTE(toshi): We will only fetch lat lngs for most granular dimensions
        target_dimension_name = get_most_granular_dimension(
            self.dimensions, Map.mappable_dimension_priority
        )

        # Add lat long field names, along with parent dimension names
        self._lat_lng_fields = self.geo_to_lat_lng.get(target_dimension_name, [])
        self.dimensions.extend(self._lat_lng_fields)

        # The user should specify which dimensions will be used as the label
        # for the output values. Default to the requested dimensions if not
        # specified.
        self._label_dimensions = request.get('labelDimensions') or self._dimension_names

    def build_df(self, raw_df):
        if raw_df.empty:
            return raw_df

        # TODO(stephen): If no dimensions are grouped on, there should only be
        # one row returned. Validate this.
        if not self.dimensions:
            raw_df['key'] = 'All'
            return raw_df

        # Add a 'key' column so that the grouped dimensions can be represented
        # in a single string to display on the frontend. The key is based off
        # the label dimensions.
        label_df = build_key_column(
            raw_df, 'key', self._dimension_names, self._label_dimensions
        )
        return raw_df.join(label_df, on=self._dimension_names)

    def build_response(self, df):
        '''Output records for geo.
        '''

        data = []
        dates = sorted(df['timestamp'].unique())

        for date in dates:
            datedDf = df[df['timestamp'] == date]
            datedData = build_map_response(
                datedDf,
                self._dimension_names,
                self.numeric_fields,
                self._lat_lng_fields,
                self.nation_name,
            )

            datedDict = {'date': date, 'datedData': datedData['data']}

            data.append(datedDict)

        return {'data': data}
