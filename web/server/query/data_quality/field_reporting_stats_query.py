# mypy: disallow_untyped_defs=True
from typing import Dict, List, TypedDict

import pandas as pd
import related

from pydruid.utils.aggregators import doublemax, doublemin

from data.query.models.calculation import Calculation, SumCalculation
from data.query.models.field import Field
from data.query.models.query_filter import FieldFilter
from db.druid.calculations.calculation_merger import CalculationMerger
from db.druid.calculations.count_calculation import CountCalculation
from db.druid.calculations.simple_calculation import TimeCalculation
from db.druid.calculations.unique_calculations import ThetaSketchUniqueCountCalculation
from db.druid.datasource import DruidDatasource
from web.server.routes.views.query_policy import AuthorizedQueryClient
from web.server.query.data_quality.data_quality_util import build_query_filter
from web.server.query.insights.util import convert_epoch_ms_to_date
from web.server.query.visualizations.base import QueryBase, TIMESTAMP_COLUMN
from web.server.query.visualizations.request import QueryRequest


class ReportingStatsFieldResponse(TypedDict):
    count: int
    dateCount: int
    endDate: str
    startDate: str


class ReportingStatsQueryResponseRow(TypedDict):
    dimensions: Dict[str, str]
    metrics: Dict[str, ReportingStatsFieldResponse]


ReportingStatsQueryResponse = List[ReportingStatsQueryResponseRow]


class ReportingStatsCalculationIds:
    '''A convenience class that builds a stable set of IDs that the calculation and
    result parser can use.
    '''

    def __init__(self, field_id: str):
        self.first_report_id = f'{field_id}_first_report'
        self.last_report_id = f'{field_id}_last_report'
        self.count_id = f'{field_id}_count'
        self.date_count_id = f'{field_id}_date_count'


@related.immutable
class ReportingStatsCalculation(Calculation):
    '''The `ReportingStatsCalculation` will calculate a set of statistics for the
    original calculation provided:
        - count: The number of data points the original calculation would use.
        - dateCount: The number of unique dates that data was reported for.
        - startDate: The first date that data was reported for the original calculation.
        - endDate: The last date that data was reported for the original calculation.
    '''

    # NOTE(stephen): Need to make this optional due to earlier calculation properties
    # also being optional.
    original_calculation = Calculation.child_field(required=False)
    type = related.StringField('REPORTING_STATS')

    def to_druid(self, result_id: str) -> CalculationMerger:
        # If the original calculation is not defined, we cannot calculate a result.
        if not self.original_calculation:
            calculation = SumCalculation(
                filter=FieldFilter('NON_EXISTANT_FIELD')
            ).to_druid(result_id)
            return calculation

        calc_ids = ReportingStatsCalculationIds(result_id)
        query_filter = build_query_filter(self.original_calculation.to_druid(result_id))

        # The first date that data was reported for this calculation.
        start_time_calculation = TimeCalculation(
            calc_ids.first_report_id, doublemin, query_filter
        )

        # The last date that data was reported for this calculation.
        end_time_calculation = TimeCalculation(
            calc_ids.last_report_id, doublemax, query_filter
        )

        # The number of data points reported for this calculation.
        count_calculation = CountCalculation(calc_ids.count_id, query_filter)

        # The number of dates values have been reported for this calculation.
        # NOTE(stephen): It's a little overkill to use a thetasketch here, but it's
        # fast enough for our purposes. Setting the sketch size to 8192 which would be
        # > 20 years worth of unique dates with exact accuracy. If more than 20 years
        # worth of unique dates exist, we will enter into the "approximate count
        # distinct" territory and the value returned will no longer be exact.
        date_count_calculation = ThetaSketchUniqueCountCalculation(
            name=calc_ids.date_count_id,
            theta_sketch_field='Real_Date',
            size=8192,
            count_filter=query_filter,
            is_input_theta_sketch=False,
        )

        return CalculationMerger(
            [
                start_time_calculation,
                end_time_calculation,
                count_calculation,
                date_count_calculation,
            ]
        )


def build_field_response(field_id: str, row: dict) -> ReportingStatsFieldResponse:
    '''Build reporting stats response data for the given field using the raw druid
    response row provided.
    '''
    calc_ids = ReportingStatsCalculationIds(field_id)

    # NOTE(stephen): The incoming row *might not* contain all fields that we need. And
    # sometimes it might contain fields with `None` as the value. To ensure we can
    # handle both these cases, we safely check for the value and then default to 0
    # if it is not found OR if it is None.
    return {
        'count': int(row.get(calc_ids.count_id) or 0),
        'dateCount': int(row.get(calc_ids.date_count_id) or 0),
        'endDate': convert_epoch_ms_to_date(row.get(calc_ids.last_report_id) or 0),
        'startDate': convert_epoch_ms_to_date(row.get(calc_ids.first_report_id) or 0),
    }


def build_field(field: Field) -> Field:
    '''Cast the original field into a new field with our reporting stats calculation
    attached.
    '''
    # mypy-related-issue
    return Field(  # type: ignore[call-arg]
        id=field.id,
        calculation=ReportingStatsCalculation(original_calculation=field.calculation),
    )


def build_request(original_request: QueryRequest) -> QueryRequest:
    '''Build the reporting stats calculation request based off the original request
    received.
    '''
    # mypy-related-issue
    # type: ignore[call-arg]
    fields = [build_field(field) for field in original_request.fields]

    # NOTE(stephen): Supporting groups even though they are not expected to be passed
    # in.
    # mypy-related-issue
    request = QueryRequest(  # type: ignore[call-arg]
        fields=fields, groups=original_request.groups, filter=original_request.filter
    )
    return request


class FieldReportingStatsQuery(QueryBase):
    def __init__(
        self,
        request: QueryRequest,
        query_client: AuthorizedQueryClient,
        datasource: DruidDatasource,
    ):
        super().__init__(
            build_request(request),
            query_client,
            datasource,
            fill_intermediate_dates=False,
        )

    def build_response(self, df: pd.DataFrame) -> ReportingStatsQueryResponse:
        if df.empty:
            return [
                {
                    'dimensions': {},
                    'metrics': {
                        field.id: build_field_response(field.id, {})
                        for field in self.request.fields
                    },
                }
            ]

        # Build up a list of the non numeric columns
        dimension_columns = list(self.grouping_dimension_ids())
        if self.has_time_grouping():
            dimension_columns.append(TIMESTAMP_COLUMN)

        output: ReportingStatsQueryResponse = []
        for row in df.to_dict('records'):
            output_row: ReportingStatsQueryResponseRow = {
                'dimensions': {key: row[key] for key in dimension_columns},
                'metrics': {
                    field.id: build_field_response(field.id, row)
                    for field in self.request.fields
                },
            }
            output.append(output_row)

        return output
