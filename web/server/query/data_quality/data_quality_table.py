import time

from pydruid.utils.aggregators import doublemax, doublemin

from db.druid.aggregations.query_dependent_aggregation import QueryDependentAggregation
from db.druid.calculations.calculation_merger import CalculationMerger
from db.druid.calculations.simple_calculation import TimeCalculation
from db.druid.query_builder import GroupByQueryBuilder
from db.druid.calculations.unique_calculations import ThetaSketchUniqueCountCalculation
from db.druid.util import build_query_filter_from_aggregations
from web.server.query.visualizations.aqt.aqt_base import AQTBase

MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000


def first_report_id(prefix):
    return f'{prefix}__first_report'


def last_report_id(prefix):
    return f'{prefix}__last_report'


def days_reporting_id(prefix):
    return f'{prefix}__days_reporting'


def silent_days_id(prefix):
    return f'{prefix}__silent_days'


def build_query_filter(original_calculation):
    '''Build a query filter that will captures all reported events for the given
    calculation.
    '''
    aggregations = {}
    for key, aggregation in original_calculation.aggregations.items():
        agg = aggregation
        # If the aggregation requires information from the query to be computed, extract
        # the filter applied to the base aggregation. Most aggregations of this type
        # have a dependency on *time*, which we do not care about here. We want to
        # capture all events and we can ignore the query dependent portion since we are
        # not trying to accurately calculate the aggregation's value.
        if isinstance(aggregation, QueryDependentAggregation):
            agg = aggregation.base_aggregation
        aggregations[key] = agg
    return build_query_filter_from_aggregations(aggregations)


def build_calculation(field):
    field_id = field.id
    query_filter = build_query_filter(field.calculation.to_druid(field_id))

    # Calculate the first and last times a report was submitted.
    first_id = first_report_id(field_id)
    first_report_calculation = TimeCalculation(first_id, doublemin, query_filter)

    last_id = last_report_id(field_id)
    last_report_calculation = TimeCalculation(last_id, doublemax, query_filter)

    # Calculate the number of unique days that a report was submitted.
    days_reporting_calculation = ThetaSketchUniqueCountCalculation(
        days_reporting_id(field_id),
        '__time',
        count_filter=query_filter,
        is_input_theta_sketch=False,
    )

    calculation = CalculationMerger(
        [first_report_calculation, last_report_calculation, days_reporting_calculation]
    )

    # Calculate the number of days since the last report.
    # Floor the current epoch time to be the start of the day since all of our data in
    # Druid does not have a "time" component. This makes the result a nice round number.
    today_ms = int(time.time() * 1000 / MILLISECONDS_IN_DAY) * MILLISECONDS_IN_DAY
    formula = f'({today_ms} - {last_id}) / {MILLISECONDS_IN_DAY}'
    calculation.add_post_aggregation_from_formula(silent_days_id(field_id), formula)
    return calculation


class DataQualityTable(AQTBase):
    def __init__(self, *args, **kwargs):
        # Disable intermediate date filling because it is not needed for DataQuality
        # score computation.
        super().__init__(fill_intermediate_dates=False, *args, **kwargs)

    def build_query(self):
        calculations = [build_calculation(field) for field in self.request.fields]
        return GroupByQueryBuilder(
            datasource=self.datasource.name,
            granularity=self.request.build_granularity(),
            grouping_fields=self.request.build_dimensions(),
            intervals=self.request.build_intervals(),
            calculation=CalculationMerger(calculations),
            dimension_filter=self.request.build_query_filter(),
        )

    def build_df(self, raw_df):
        if raw_df.empty:
            return raw_df

        dimensions = self.grouping_dimension_ids()
        if dimensions:
            # Use the most granular dimension as the pretty name for each result.
            # NOTE(stephen): This assumes the dimensions are sorted from least to most
            # granular.
            raw_df['name'] = raw_df[dimensions[-1]]
        else:
            # If no dimensions are selected, assume this is a Nation level query.
            raw_df['name'] = 'Nation'
        return raw_df

    def build_response(self, df):
        '''Build the query response result from the result dataframe.'''

        # NOTE(stephen): Right now, data quality only supports one field. Build the
        # output format as if there is a single field to query.
        field_id = self.request.fields[0].id
        df['firstReport'] = df[first_report_id(field_id)]
        df['lastReport'] = df[last_report_id(field_id)]
        df['numReports'] = df[days_reporting_id(field_id)]
        df['silentDays'] = df[silent_days_id(field_id)]

        # Create a list of reporting data (by location) and a list of locations.
        report_df = df[
            ['firstReport', 'lastReport', 'numReports', 'silentDays', 'name']
        ]
        reports = report_df.to_dict('records')
        locations = df[self.grouping_dimension_ids()].to_dict('records')

        # Merge the locations into the reports.
        for i, report in enumerate(reports):
            report['locationHierarchy'] = locations[i]
        return reports
