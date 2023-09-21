# mypy: disallow_untyped_defs=True
from typing import Tuple, Dict, Optional

from pandas import DataFrame, Series

from web.server.query.data_quality.outliers_base import OutliersBase
from web.server.query.data_quality.types import OutlierAnalysis
from web.server.query.data_quality.data_quality_score import SCORE_WEIGHTS
from web.server.query.data_quality.outliers_score import (
    calculate_score,
    calculate_score_series,
)
from web.server.query.data_quality.outliers_util import build_outlier_df
from web.server.query.request import QueryRequest
from web.server.routes.views.query_policy import AuthorizedQueryClient
from db.druid.datasource import DruidDatasource

FAILED_OUTLIERS_REPONSE: OutlierAnalysis = {
    'maxScore': 0,
    'score': 0,
    'numFacilities': 0,
    'numValues': 0,
    'firstReportDate': '1970-01-01',
    'percentageExtremeOutliers': 0,
    'percentageModerateOutliers': 0,
    'success': False,
}


def calculate_outlier_fractions(df: DataFrame, field_id: str) -> Tuple[Series, Series]:
    # Summarize the outlier information for the provided dataframe and field.
    # NOTE: Depending on the format of the dataframe, the
    # calculations here could produce a series or an integer. If the input is a
    # grouped dataframe, then the result will be as series. Otherwise, the
    # output will be numeric.
    extreme_outliers = moderate_outliers = 0
    if 'extreme_outliers' in df:
        extreme_outliers = df['extreme_outliers'].sum().astype(int)

    if 'moderate_outliers' in df:
        moderate_outliers = df['moderate_outliers'].sum().astype(int)

    value_counts = df[field_id].count()
    fraction_extremes = extreme_outliers / value_counts
    fraction_moderates = moderate_outliers / value_counts
    return (fraction_extremes, fraction_moderates)


def build_dimension_level_response(
    outlier_df: DataFrame, field_id: str, aggregation_dimension: str
) -> dict:
    # Summarize the outlier information to the requested aggregation level.
    grouped_outlier_df = outlier_df.groupby([aggregation_dimension])
    fraction_extreme_series, fraction_moderate_series = calculate_outlier_fractions(
        grouped_outlier_df, field_id
    )

    score_series = calculate_score_series(
        fraction_extreme_series, fraction_moderate_series
    )

    # Format the result into the expected output format
    response_df = score_series.rename('score').to_frame()
    response_df['percentageExtremeOutliers'] = (fraction_extreme_series * 100).round(2)
    response_df['percentageModerateOutliers'] = (fraction_moderate_series * 100).round(
        2
    )
    response_df['maxScore'] = SCORE_WEIGHTS['OUTLIERS']

    # NOTE: The dimension level response does not need the reports
    # metadata. We add it here to make sure that the response fits the shape
    # that the frontend expects.
    # TODO: The dimension level response is only used for the DQL map
    # viz. This should be decoupled to have its own endpoints and models.
    response_df['firstReportDate'] = '1970-01-01'
    response_df['numValues'] = 0
    response_df['numFacilities'] = 0
    response_df['success'] = True

    return response_df.to_dict('index')


def build_overall_response(
    outlier_df: DataFrame, field_id: str
) -> Dict[str, OutlierAnalysis]:

    if (
        field_id not in outlier_df
        or outlier_df[field_id].isnull().values.all()
        or 'key' not in outlier_df
    ):
        # If a field has no sufficient data, or is missing a key, then return a failed repsonse
        return {'overall': FAILED_OUTLIERS_REPONSE}

    num_values = outlier_df[field_id].count()
    num_facilities = len(outlier_df['key'].unique())
    first_report_date = outlier_df['timestamp'].min()

    fraction_extremes, fraction_moderates = calculate_outlier_fractions(
        outlier_df, field_id
    )

    return {
        'overall': {
            'maxScore': SCORE_WEIGHTS['OUTLIERS'],
            'score': calculate_score(fraction_extremes, fraction_moderates),
            'numFacilities': int(num_facilities),
            'numValues': int(num_values),
            'firstReportDate': first_report_date,
            'percentageExtremeOutliers': round((fraction_extremes * 100), 2),
            'percentageModerateOutliers': round((fraction_moderates * 100), 2),
            'success': True,
        }
    }


class OutliersReport(OutliersBase):
    '''Class to process the pandas dataframe returned from a druid query into
    the format needed for the Outlier Analysis tab of Data Quality Lab
    '''

    def __init__(
        self,
        request: QueryRequest,
        query_client: AuthorizedQueryClient,
        datasource: DruidDatasource,
    ):
        super().__init__(request, query_client, datasource)

        self.aggregation_dimension: Optional[str] = (
            self.grouping_dimension_ids()[0] if self.grouping_dimension_ids() else None
        )

    def build_response(self, df: DataFrame) -> Dict[str, Dict[str, OutlierAnalysis]]:
        if df.empty:
            return {
                field.id: {'overall': FAILED_OUTLIERS_REPONSE}
                for field in self.request.fields
            }

        output = {}

        for field in self.request.fields:
            field_id = field.id

            # TODO: Look into building one outlier dataframe for all
            # fields outside of the loop. Consider overriding the build_df
            # method.
            outlier_df = build_outlier_df(df, field_id, True, True, False)

            overall_response = build_overall_response(outlier_df, field_id)

            if self.aggregation_dimension:
                output[field_id] = {
                    **overall_response,
                    **build_dimension_level_response(
                        outlier_df, field_id, self.aggregation_dimension
                    ),
                }
            else:
                output[field_id] = overall_response

        return output
