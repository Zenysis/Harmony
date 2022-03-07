from builtins import object
from datetime import datetime

from pydruid.utils.filters import Dimension
from data.pipeline.datatypes.base_row import BaseRow
from db.druid.calculations.base_calculation import BaseCalculation
from db.druid.query_builder import GroupByQueryBuilder
from log import LOG
from util.ethiopian_calendar import formatter as et_date_formatter

SOURCE_FIELD = BaseRow.SOURCE_FIELD
# TODO: put these things in config?
MIN_TIME_FIELD = 'mintime'
MAX_TIME_FIELD = 'maxtime'

# Predefine the time interval to query over to be as large as possible since
# druid doesn't care. Avoid using time_boundary.get_full_time_interval so that
# we can parallelize these initialization steps.
INTERVAL = ['1970-01-01/2070-01-01']


class SourceStatus(object):
    def __init__(
        self,
        query_client,
        datasource,
        static_data_status_information,
        et_date_selection_enabled,
    ):
        self.query_client = query_client
        self.status = {}
        self.datasource = datasource
        self.static_data_status_information = dict(static_data_status_information)
        self.et_date_selection_enabled = et_date_selection_enabled

    def load_all_status(self):
        """Load status from different sources to self.status.
        """
        date_ranges_map = self.load_ranges_from_druid()
        static_info = self.static_data_status_information

        # First add the ones with data in alphabetical order.
        for (source, entry) in list(date_ranges_map.items()):
            static_entry = static_info.pop(
                source, {'status': '', 'notes': '', 'granularity': ''}
            )
            if static_entry.get('hide'):
                continue
            self.status[source] = {
                'status': static_entry.get('status'),
                'status_text': static_entry.get('status_text'),
                'notes': static_entry.get('notes'),
                'color': static_entry.get('color'),
                'granularity': static_entry.get('granularity'),
                'validation_status': static_entry.get('validation_status'),
                'validation_text': static_entry.get('validation_text'),
                'validation_url': static_entry.get('validation_url'),
            }
            self.status[source].update(entry)
        # Now deal with the entries without data yet.
        for source in list(static_info.keys()):
            if static_info[source].get('hide'):
                continue
            self.status[source] = {
                'status': static_info[source].get('status'),
                'status_text': static_info[source].get('status_text'),
                'notes': static_info[source].get('notes'),
                'color': static_info[source].get('color'),
                'granularity': static_info[source].get('granularity'),
                'validation_status': static_info[source].get('validation_status'),
                'validation_text': static_info[source].get('validation_text'),
                'validation_url': static_info[source].get('validation_url'),
            }

    def load_ranges_from_druid(self):
        """Return a dictionary mapping data source name to a
        dictionary (minTime, maxTime) of datetime objects.
        """
        date_ranges = {}
        LOG.info('Querying time ranges of data from Druid...')
        aggregations = {
            MIN_TIME_FIELD: {'type': 'longMin', 'fieldName': '__time'},
            MAX_TIME_FIELD: {'type': 'longMax', 'fieldName': '__time'},
        }
        calculation = BaseCalculation(aggregations=aggregations)
        query = GroupByQueryBuilder(
            datasource=self.datasource.name,
            granularity='all',
            grouping_fields=[SOURCE_FIELD],
            intervals=INTERVAL,
            calculation=calculation,
        )
        query.query_filter &= Dimension(SOURCE_FIELD) != None

        query_result = self.query_client.run_query(query)
        for row in query_result.result:
            event = row['event']
            # making {data_source: (minTime, maxTime)}
            date_ranges[event[SOURCE_FIELD]] = {
                MIN_TIME_FIELD: self.date_from_timestamp(event[MIN_TIME_FIELD]),
                MAX_TIME_FIELD: self.date_from_timestamp(event[MAX_TIME_FIELD]),
            }

        LOG.info('Done querying date ranges of data')
        return date_ranges

    def get_most_recent_update_time(self):
        date = self.datasource.date
        if self.et_date_selection_enabled:
            return et_date_formatter.format_date(date)
        return date.strftime('%b %-d %Y')

    @staticmethod
    def date_from_timestamp(timestamp):
        """Return a python datetime object from unix epoch time in ms.
        """
        return datetime.utcfromtimestamp(timestamp / 1000.0)
