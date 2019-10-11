# pylint: disable=R0204

from builtins import str
from builtins import object
import json
import pandas as pd
from datetime import datetime


from config.system import STANDARD_DATA_DATE_FORMAT
from config.aggregation import GEO_TO_LATLNG_FIELD, GEO_FIELD_ORDERING
from config.indicators import VALID_FIELDS
from config.druid import DIMENSIONS
from config.indicators import ID_LOOKUP
from db.druid.query_client import DruidQueryClient_
from web.server.routes.views.geo_time_aggregator import GeoTimeAggregator


class AggregationQueryWrapper(object):
    '''
    Wrapper class for GeoTimeAggregator
    '''

    _VALID_GRANULARITIES = set(GEO_TO_LATLNG_FIELD.keys())

    def __init__(self):
        self.reset_request_data()

    @staticmethod
    def _validate_date(date_str):
        try:
            datetime.strptime(date_str, STANDARD_DATA_DATE_FORMAT)
        except ValueError:
            errmsg = 'Incorrect date format given (%s), should be YYYY-MM-DD' % date_str
            raise ValueError(errmsg)

    @staticmethod
    def _validate_fields(fields):
        for f in fields:
            if f not in VALID_FIELDS:
                raise ValueError('%s is not a valid field' % f)

    @staticmethod
    def _validate_denominator(denom):
        if denom is not None and denom not in VALID_FIELDS:
            raise ValueError('Denominator (%s) is not a valid field' % denom)

    @staticmethod
    def _validate_granularity(granularity):
        if granularity not in AggregationQueryWrapper._VALID_GRANULARITIES:
            granularities_str = ', '.join(AggregationQueryWrapper._VALID_GRANULARITIES)
            errmsg = (
                'You must specify a valid granularity. One of: %s' % granularities_str
            )
            raise Exception(errmsg)

    @staticmethod
    def _validate_filters(filters):
        for filter_obj in filters:
            for key in filter_obj:
                if key not in DIMENSIONS:
                    errmsg = '%s is not a valid dimension to filter by.' % key
                    raise ValueError(errmsg)

    @staticmethod
    def _result_to_pandas(result):
        ''' Given a druid query result return a pandas dataframe.
        The data frame will consist of columns: [Real_Date', Indicator_id', 'val', 'GeoKey',
         'lat', 'lng', 'name', '*Name', 'Indicator']
        From the dataframe it's trivial to save a csv file: DF.to_csv('filename.txt'). '''
        result_dataframe = pd.DataFrame()
        for geokey, data in result['data']['byGeo'].items():
            geo_dataframe = pd.DataFrame(data['data']['month']).stack().reset_index()
            geo_dataframe.columns = ['Indicator_id', 'Real_Date', 'val']
            geo_dataframe['GeoKey'] = geokey
            # Fill in the meta data fields.
            for key, val in data['metadata'].items():
                geo_dataframe[key] = val
            # Remove missing data
            geo_dataframe = geo_dataframe[geo_dataframe['Indicator_id'] != 'Real_Date']
            result_dataframe = result_dataframe.append(geo_dataframe, ignore_index=True)
        # If dataframe is not empty then fill in the indicator names using ID_LOOKUP.
        if not result_dataframe.empty:
            result_dataframe['Indicator'] = [
                ID_LOOKUP[ind_id]['text'] for ind_id in result_dataframe['Indicator_id']
            ]
        return result_dataframe

    def set_request_data(self, req_data):
        for key in req_data:
            self.request_data[key] = req_data[key]
        return self

    def reset_request_data(self):
        self.request_data = {
            'demo': False,
            'start_date': None,
            'end_date': None,
            'fields': [],
            'filters': [],
            'denominator': None,
            'granularity': None,
        }
        return self

    def set_is_demo(self, is_demo):
        self.request_data['demo'] = is_demo
        return self

    def set_date_range(self, start_date, end_date):
        ''' date format: 'YYYY-MM-DD' '''
        self._validate_date(start_date)
        self._validate_date(end_date)
        self.request_data['start_date'] = start_date
        self.request_data['end_date'] = end_date
        return self

    def add_field(self, field):
        ''' Add a single indicator id. Example: 'hmis_indicator_3199' '''
        self.request_data['fields'].append(field)
        return self

    def add_fields(self, fields):
        ''' Add a list of indicator ids. Example: ['hmis_indicator_3199', ...]'''
        for f in fields:
            self.add_field(f)
        return self

    def add_filter(self, filter_obj):
        ''' Example: filter_obj = {"RegionName": "Addis Ababa"} '''
        self.request_data['filters'].append(filter_obj)
        return self

    def clear_filters(self):
        self.request_data['filters'] = []
        return self

    def set_denominator(self, denom):
        self.request_data['denominator'] = denom
        return self

    def set_granularity(self, granularity):
        ''' set FacilityName, WoredaName, ZoneName, RegionName, nation'''
        self.request_data['granularity'] = granularity
        return self

    def set_time_granularities(self, granularities):
        '''
        Example: ['month', 'all' ] would aggregate by month as well as by over
        the entire date range
        '''
        self.request_data['granularities'] = granularities
        return self

    def run(self, get_json=False, get_csv=False, get_pandas=False):
        ''' Setup the following before running:
        1. self.set_date_range
        2. self.add_fields
        3. self.set_granularity
        By default returns a json obj with requested data.
        Toggle the return format by setting get_json, get_csv, or get_pandas to true'''
        req_data = self.request_data
        # Validate that all required query params have been set
        if req_data['start_date'] is None:
            raise ValueError('You must specify a start date')
        if req_data['end_date'] is None:
            raise ValueError('You must specify an end date')
        if req_data['fields'] == []:
            raise ValueError('You must specify at least one field to query')
        if req_data['granularity'] is None:
            raise ValueError('You must specify a geo granularity')

        # Validate the params themselves
        self._validate_date(req_data['start_date'])
        self._validate_date(req_data['end_date'])
        self._validate_fields(req_data['fields'])
        self._validate_denominator(req_data['denominator'])
        self._validate_granularity(req_data['granularity'])
        self._validate_filters(req_data['filters'])

        # All necessary arguments have been set and validated, now run query
        aggregator = GeoTimeAggregator(DruidQueryClient_(), GEO_FIELD_ORDERING)
        aggregator.run(req_data)
        if get_json:
            return json.dumps(aggregator.get_response())
        elif get_csv:
            return self._result_to_pandas(aggregator.get_response()).to_csv()
        elif get_pandas:
            return self._result_to_pandas(aggregator.get_response())
        else:
            return aggregator.get_response()

    def __str__(self):
        return str(self.request_data)
