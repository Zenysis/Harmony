from datetime import datetime

import pandas as pd

from flask import current_app
from db.druid.query_builder import GroupByQueryBuilder
from db.druid.util import DRUID_DATE_FORMAT

from web.server.query.data_quality.data_quality_score import score, FAILED_QUALITY_SCORE
from web.server.query.data_quality.data_quality_util import (
    modify_request_for_data_quality_reporting,
)
from web.server.query.data_quality.outliers_report import FAILED_OUTLIERS_REPONSE
from web.server.query.visualizations.base import QueryBase, TIMESTAMP_COLUMN
from web.server.query.visualizations.request import parse_groups_for_query
from web.server.query.visualizations.util import build_key_column


def get_report_counts(all_dates, report_dates, raw_counts):
    # raw_counts and report_dates only includes dates where there are a non-zero
    # number of reports for that dimension value (e.g. a specific facility). We
    # want to fill in zeros across all dates when any reports have been
    # received.
    report_date_to_count = dict(zip(report_dates, raw_counts))
    return [report_date_to_count.get(date, 0) for date in all_dates]


def build_dimension_level_response(
    df,
    all_report_dates,
    no_date_filter_df,
    num_reports_key,
    lat_lng_fields,
    dimension_names,
    end_interval_date,
    outliers_response_for_field,
):
    lat_field, lng_field = lat_lng_fields

    # NOTE(david): The dimension level response is only used to power the map so
    # we filter out dimension values without latitudes/longitudes.
    filtered_df = df[df[lat_lng_fields].notnull().all(1)]

    # Find the unique keys since we need to build a single result for each key.
    keys = filtered_df['key'].unique()

    output = {}
    for key in keys:
        df_slice = filtered_df[filtered_df['key'] == key]

        # Get the first row with a given key. This is used to extract value
        # that are constant for the same key such as latitutde, longitude and
        # the dimension values.
        first_row = df_slice.iloc[0]

        lat = first_row[lat_field]
        lng = first_row[lng_field]

        dimensions = {}
        for dimension in dimension_names:
            dimensions[dimension] = first_row[dimension]

        raw_counts = list(df_slice[num_reports_key])
        report_dates = list(df_slice['dates'])
        counts = get_report_counts(all_report_dates, report_dates, raw_counts)

        first_report_date = min(
            list(no_date_filter_df[no_date_filter_df['key'] == key]['dates'])
        ).tz_localize(None)

        output[key] = {
            **score(all_report_dates, counts, first_report_date, end_interval_date),
            'geo': {'lat': lat, 'lng': lng},
            'dimensions': dimensions,
            'outlierAnalysis': outliers_response_for_field.get(
                key, FAILED_OUTLIERS_REPONSE
            ),
        }

    return output


def build_overall_response(
    df,
    all_report_dates,
    no_date_filter_df,
    num_reports_key,
    end_interval_date,
    outliers_response_for_field,
):
    df_slice = df[['dates', num_reports_key]].groupby('dates').sum()

    raw_counts = list(df_slice[num_reports_key])
    report_dates = list(df_slice.index)
    counts = get_report_counts(all_report_dates, report_dates, raw_counts)

    first_report_date = min(list(no_date_filter_df['dates'])).tz_localize(None)
    return {
        'overall': {
            **score(all_report_dates, counts, first_report_date, end_interval_date),
            # We don't use dimensions or lat/lng for the overall reponse
            'geo': {'lat': 0, 'lng': 0},
            'dimensions': {},
            'outlierAnalysis': outliers_response_for_field.get(
                'overall', FAILED_OUTLIERS_REPONSE
            ),
        }
    }


class DataQualityReport(QueryBase):
    ''' Class to process the pandas dataframe returned from a druid query into the format needed
    for Data Quality Lab
    '''

    def __init__(
        self,
        request,
        query_client,
        datasource,
        geo_to_lat_lng=None,
        dimension_parents=None,
    ):
        # Modify the query request that is received and convert it into a DataQuality
        # specific format. Also disable intermediate date filling because it is not
        # needed for DataQuality score computation.
        super().__init__(
            modify_request_for_data_quality_reporting(request),
            query_client,
            datasource,
            False,
        )
        self.geo_to_lat_lng = geo_to_lat_lng or {}
        self.dimension_parents = dimension_parents or {}

        # NOTE(stephen): Store the original request in case we need to also query for
        # outliers. The outliers query is based off the original request, not the
        # modified DataQuality specific query.
        self.original_request = request

        self._dimension_names = self.grouping_dimension_ids()

        if self._dimension_names:
            # DQL Only ever uses one geo dimension
            self._geo_dimension = self._dimension_names[0]

            self._lat_lng_fields = list(
                self.geo_to_lat_lng.get(self._geo_dimension, [])
            )

            # Add in dimension parents so that geoKey can be generated properly
            # for DQL Map viz.
            self._dimension_names = self.dimension_parents.get(
                self._geo_dimension, []
            ) + [self._geo_dimension]

    def build_query(self):
        query = self.request.to_druid_query(self.datasource.name)

        # If there are no geo dimensions to query, do nothing.
        if not self._dimension_names:
            return query

        # Set the dimensions to query to be only mappable dimensions and the
        # associated lat/lng dimensions.
        query.dimensions = self._dimension_names + self._lat_lng_fields

        return query

    def build_df(self, raw_df):
        # NOTE(stephen): Need to handle this check here because build_df is called for
        # multiple dataframe formats. This tests for a pydruid limitation where a
        # None value can be returned instead of an empty dataframe.
        if raw_df is None:
            raw_df = pd.DataFrame()

        if raw_df.empty:
            return raw_df

        if self._dimension_names:
            # Ensure that each dimension value has a unique key by including values
            # from higher up the hierarchy if neccessary.
            label_df = build_key_column(
                raw_df, 'key', [self._geo_dimension], [self._geo_dimension]
            )

            return raw_df.join(label_df, on=self._geo_dimension)

        return raw_df

    # pylint: disable=arguments-differ
    def build_response(
        self, df, no_date_filter_df, no_geo_filter_df, outliers_response=None
    ):
        '''Outputs data quality scores for an indicator overall, subject to the
        filters applied, as well as for each dimension value in a dimension group by.
        '''
        if df.empty:
            return {
                field.id: {
                    'overall': {
                        **FAILED_QUALITY_SCORE,
                        'dimensions': [],
                        'geo': {'lat': 0, 'lng': 0},
                        'outlierAnalysis': FAILED_OUTLIERS_REPONSE,
                    }
                }
                for field in self.request.fields
            }

        # Cast the timestamp column to a datetime since `score` needs it to be fully
        # parsed.
        for input_df in (df, no_date_filter_df, no_geo_filter_df):
            input_df['dates'] = pd.to_datetime(
                input_df[TIMESTAMP_COLUMN], format=DRUID_DATE_FORMAT
            )

        end_interval_date = datetime.strptime(
            self.request.build_intervals()[0].split('/')[1], DRUID_DATE_FORMAT
        )

        today = datetime.today()

        if end_interval_date > today:
            end_interval_date = today

        outliers_response = outliers_response or {}

        output = {}

        for field in self.request.fields:
            field_id = field.id

            all_report_dates_df = no_geo_filter_df.loc[no_geo_filter_df[field_id] != 0]
            all_report_dates = sorted(
                set(all_report_dates_df['dates'].dt.tz_localize(None))
            )

            outliers_response_for_field = outliers_response.get(field_id, {})

            data_quality_scores = build_overall_response(
                df,
                all_report_dates,
                no_date_filter_df,
                field_id,
                end_interval_date,
                outliers_response_for_field,
            )

            if self._dimension_names:
                data_quality_scores.update(
                    build_dimension_level_response(
                        df,
                        all_report_dates,
                        no_date_filter_df,
                        field_id,
                        self._lat_lng_fields,
                        self._dimension_names,
                        end_interval_date,
                        outliers_response_for_field,
                    )
                )

            output[field.id] = data_quality_scores

        return output

    def get_no_date_filter_df(self) -> pd.DataFrame:
        intervals = [
            current_app.druid_context.data_time_boundary.get_full_time_interval()
        ]

        # TODO(david): Update this when we work out a way of getting the first report
        # date for each geography without retriveing all report dates.
        # TODO(david): Work out a way of seperating the existing time and geographical
        # filters so that the geo filters can be included here. This will do for now as the only
        # effect this will have is if some dimension values are split across several higher
        # dimension values. E.g. if a county is split accross two regions and the different parts of
        # that county have different first report dates.
        druid_grouping_selection = parse_groups_for_query(
            self.request.groups, intervals
        )
        query = GroupByQueryBuilder(
            datasource=self.datasource.name,
            granularity=druid_grouping_selection.granularity,
            grouping_fields=druid_grouping_selection.dimensions,
            intervals=intervals,
            calculation=self.request.build_calculation(),
        )

        raw_df = self.query_client.run_query(query).export_pandas()
        return self.build_df(raw_df)

    def get_no_geo_filter_df(self) -> pd.DataFrame:
        # TODO(david): Work out a way of removing dimension filters from the
        # calculation as extra filters can be added to individual fields in
        # insights.
        intervals = self.request.build_intervals()
        druid_grouping_selection = parse_groups_for_query(
            self.request.groups, intervals
        )
        query = GroupByQueryBuilder(
            datasource=self.datasource.name,
            granularity=druid_grouping_selection.granularity,
            grouping_fields=druid_grouping_selection.dimensions,
            intervals=intervals,
            calculation=self.request.build_calculation(),
        )

        raw_df = self.query_client.run_query(query).export_pandas()
        return self.build_df(raw_df)

    # pylint: disable=arguments-differ
    def get_response(self, include_outliers=False):
        outliers_response = None
        return self.build_response(
            self.get_df(),
            self.get_no_date_filter_df(),
            self.get_no_geo_filter_df(),
            outliers_response,
        )
