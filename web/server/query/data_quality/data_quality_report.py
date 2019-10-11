import time
import pandas as pd

from flask import current_app
from db.druid.query_builder import GroupByQueryBuilder
from db.druid.calculations.base_calculation import BaseCalculation
from db.druid.util import DRUID_DATE_FORMAT
from web.server.query.visualizations.aqt.aqt_base import AQTBase, TIMESTAMP_COLUMN
from web.server.data.reporting_score import score
from web.server.query.visualizations.util import build_key_column


def build_dimension_level_response(df, no_date_filter_df, numeric_field_count):
    # Find the unique keys since we need to build a single result for each key.
    keys = df['key'].unique()

    output = {}
    for key in keys:
        df_slice = df[df['key'] == key]

        dates = list(df_slice['dates'])
        counts = list(df_slice[numeric_field_count])

        first_report_date = min(
            list(no_date_filter_df[no_date_filter_df['key'] == key]['dates'])
        ).tz_localize(None)

        output[key] = score(dates, counts, first_report_date)

    return output


def build_overall_response(df, no_date_filter_df, numeric_field_count):
    df_slice = df[['dates', numeric_field_count]].groupby('dates').sum()
    dates = list(df_slice.index)
    counts = list(df_slice[numeric_field_count])
    first_report_date = min(list(no_date_filter_df['dates'])).tz_localize(None)
    return {'overall': score(dates, counts, first_report_date)}


class DataQualityReport(AQTBase):
    ''' Class to process the pandas dataframe returned from a druid query into the format needed
    for Data Quality Lab
    '''

    def __init__(self, *args, **kwargs):
        # Disable intermediate date filling because it is not needed for DataQuality
        # score computation.
        super().__init__(fill_intermediate_dates=False, *args, **kwargs)

    def build_df(self, raw_df):
        dimensions = self.grouping_dimension_ids()

        if raw_df.empty:
            return raw_df

        # Cast the timestamp column to a datetime since `score` needs it to be fully parsed.
        raw_df['dates'] = pd.to_datetime(
            raw_df[TIMESTAMP_COLUMN], format=DRUID_DATE_FORMAT
        )

        if dimensions:
            # Ensure that each dimension value has a unique key by including values
            # from higher up the hierarchy if neccessary.
            label_df = build_key_column(raw_df, 'key', dimensions, dimensions)

            return raw_df.join(label_df, on=dimensions)

        return raw_df

    def build_response(self, df):
        '''Outputs data quality scores for an indicator overall, subject to the
        filters applied, as well as for each dimension value in a dimension group by.
        '''
        if df.empty:
            no_date_filter_df = self.get_no_date_filter_df()
            first_report_timestamp = min(list(no_date_filter_df['dates']))
            return {
                'dataQuality': {
                    'overall': {
                        'success': False,
                        'data': [],
                        # TODO: better way of doing this (maybe should retrieve this seperately)
                        'metadata': {
                            'firstReportTimestamp': int(
                                time.mktime(first_report_timestamp.timetuple())
                            )
                        },
                    }
                }
            }

        no_date_filter_df = self.get_no_date_filter_df()

        numeric_field_count = BaseCalculation.count_field_name(
            self.request.fields[0].id
        )

        data_quality_scores = build_overall_response(
            df, no_date_filter_df, numeric_field_count
        )

        grouping_dimensions = self.request.grouping_dimensions()

        if grouping_dimensions:
            data_quality_scores.update(
                build_dimension_level_response(
                    df, no_date_filter_df, numeric_field_count
                )
            )

        return {'dataQuality': data_quality_scores}

    def get_no_date_filter_df(self):
        interval = current_app.druid_context.data_time_boundary.get_full_time_interval()

        # TODO(david): Update this when we work out a way of getting the first report
        # date for each geography without retriveing all report dates.
        # TODO(david): Work out a way of seperating the existing time and geographical
        # filters so that the geo filters can be included here. This will do for now as the only
        # effect this will have is if some dimension values are split across several higher
        # dimension values. E.g. if a county is split accross two regions and the different parts of
        # that county have different first report dates.
        earliest_report_query = GroupByQueryBuilder(
            self.datasource.name,
            'day',
            self.request.build_dimensions(),
            [interval],
            self.request.build_calculation(),
        )

        raw_df = self.query_client.run_query(earliest_report_query).export_pandas()

        return self.build_df(raw_df)
