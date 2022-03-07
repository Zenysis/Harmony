import time

from pydruid.utils.aggregators import doublemax
from pydruid.utils.filters import Dimension as DimensionFilter

from db.druid.calculations.calculation_merger import CalculationMerger
from db.druid.calculations.simple_calculation import TimeCalculation
from db.druid.query_builder import GroupByQueryBuilder
from db.druid.calculations.unique_calculations import ThetaSketchUniqueCountCalculation
from web.server.query.data_quality.data_quality_util import build_query_filter
from web.server.query.visualizations.base import QueryBase
from web.server.query.visualizations.request import parse_groups_for_query


MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000

# NOTE(david): This only works if the calculation for queries with a single
# field. This assumption is valid for now but may change in the future.
LAST_REPORT_ID = 'last_report'
NUM_PERIODS_ID = 'num_periods'
SILENT_DAYS_ID = 'silent_days'


def build_num_periods_calculation(field):
    query_filter = build_query_filter(field.calculation.to_druid(field.id))

    # Calculate the number of unique days that a report was submitted.
    return ThetaSketchUniqueCountCalculation(
        NUM_PERIODS_ID, '__time', count_filter=query_filter, is_input_theta_sketch=False
    )


def build_calculation(field):
    field_id = field.id
    query_filter = build_query_filter(field.calculation.to_druid(field_id))

    last_report_calculation = TimeCalculation(LAST_REPORT_ID, doublemax, query_filter)

    num_periods_calculation = build_num_periods_calculation(field)

    calculation = CalculationMerger([last_report_calculation, num_periods_calculation])

    # Calculate the number of days since the last report.
    # Floor the current epoch time to be the start of the day since all of our data in
    # Druid does not have a "time" component. This makes the result a nice round number.
    today_ms = int(time.time() * 1000 / MILLISECONDS_IN_DAY) * MILLISECONDS_IN_DAY
    formula = f'({today_ms} - {LAST_REPORT_ID}) / {MILLISECONDS_IN_DAY}'
    calculation.add_post_aggregation_from_formula(SILENT_DAYS_ID, formula)
    return calculation


class DataQualityTable(QueryBase):
    def __init__(self, *args, **kwargs):
        # Disable intermediate date filling because it is not needed for DataQuality
        # score computation.
        super().__init__(fill_intermediate_dates=False, *args, **kwargs)

    def build_query(self):
        calculations = [build_calculation(field) for field in self.request.fields]

        query_filter = self.request.build_query_filter()
        use_nation_hack = self.datasource.name.startswith('et')
        if use_nation_hack:
            query_filter &= DimensionFilter('RegionName') != 'Nation'

        intervals = self.request.build_intervals()
        druid_grouping_selection = parse_groups_for_query(
            self.request.groups, intervals
        )
        return GroupByQueryBuilder(
            datasource=self.datasource.name,
            granularity=druid_grouping_selection.granularity,
            grouping_fields=druid_grouping_selection.dimensions,
            intervals=intervals,
            calculation=CalculationMerger(calculations),
            dimension_filter=query_filter,
        )

    def build_response(self, df):
        '''Build the query response result from the result dataframe.'''
        if df.empty:
            return []

        # Create a no geo filter dataframe to allow us to retrive the total
        # number of reporting periods
        no_geo_filter_df = self.get_no_geo_filter_df()

        # NOTE(stephen): Right now, data quality only supports one field. Build the
        # output format as if there is a single field to query.
        df['numPeriods'] = no_geo_filter_df.iloc[0][NUM_PERIODS_ID]
        df['numPeriodsWithReport'] = df[NUM_PERIODS_ID]
        df['lastReport'] = df[LAST_REPORT_ID]
        df['silentDays'] = df[SILENT_DAYS_ID]

        # Create a list of reporting data (by location) and a list of locations.
        report_df = df[
            ['numPeriods', 'numPeriodsWithReport', 'lastReport', 'silentDays']
        ]
        reports = report_df.to_dict('records')
        locations = df[self.grouping_dimension_ids()].to_dict('records')

        # Merge the locations into the reports.
        for i, report in enumerate(reports):
            report['geographyHierarchy'] = locations[i]
        return reports

    def get_no_geo_filter_df(self):
        intervals = self.request.build_intervals()
        druid_grouping_selection = parse_groups_for_query(
            self.request.groups, intervals
        )
        no_geo_filter_query = GroupByQueryBuilder(
            datasource=self.datasource.name,
            granularity=druid_grouping_selection.granularity,
            grouping_fields=[],
            intervals=intervals,
            calculation=build_num_periods_calculation(self.request.fields[0]),
        )

        raw_df = self.query_client.run_query(no_geo_filter_query).export_pandas()

        return self.build_df(raw_df)
