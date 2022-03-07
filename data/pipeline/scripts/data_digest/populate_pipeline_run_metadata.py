#!/usr/bin/env python
'''
Populate pipeline run metadata db rows.
Since the metadata we want to collect is still not finalized, store the metadata
in a dictionary. The metadata stored currently is the aggregated data from the
metadata digest files created in the 10_fill_dimension_data pipeline step along
with location matching (mapped and unmatched) counts.

TODO(sophie): Add other metadata such as # empty rows, # invalid dates. See
process_csv step logs and error handler for ideas.
'''
from csv import DictReader
import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Optional, Set

from pylib.base.flags import Flags

from config.system import STANDARD_DATA_DATE_FORMAT
from db.postgres.common import get_db_session, get_local_db_uri, get_session
from log import LOG
from models.alchemy.pipeline_runs import PipelineRunMetadata
from web.server.data.data_access import Transaction

SOURCE_DIR_TOKEN = '##SOURCE##'
MAX_DATE = datetime.strptime('3000-12-31', STANDARD_DATA_DATE_FORMAT)
MIN_DATE = datetime.strptime('0001-01-01', STANDARD_DATA_DATE_FORMAT)
CANONICAL_LOCATION_PREFIX = 'Canonical'
RAW_LOCATION_PREFIX = 'Clean'
STR_TO_DATE_CACHE: Dict[str, datetime] = {}
GLOBAL_PIPELINE_SUMMARY_SOURCE = 'ALL_SOURCES'


def get_full_file_path(dir_template: str, datasource: str, filename: str) -> str:
    '''Convert a directory template of the form 'a/b/##SOURCE##/b/c' to a file path
    that replaces the `##SOURCE##` token and appends the filename. So the returned
    string would be something like: 'a/b/hmis_malaria/b/c/some_filename.csv'
    '''
    old_dir_parts = dir_template.split(SOURCE_DIR_TOKEN)
    new_dir_parts = []
    for i, dir_part in enumerate(old_dir_parts):
        new_dir_parts.append(dir_part)
        if i != len(old_dir_parts) - 1:
            new_dir_parts.append(datasource)

    # does the dir path end in a forward slash? if not, add it
    if new_dir_parts[-1][-1] != '/':
        new_dir_parts.append('/')

    new_dir_parts.append(filename)
    return ''.join(new_dir_parts)


def str_to_datetime(date_str: str) -> datetime:
    '''Convert a string to a datetime object. The string must be in
    YYYY-MM-DD format
    '''
    if date_str in STR_TO_DATE_CACHE:
        return STR_TO_DATE_CACHE[date_str]
    datetime_obj = datetime.strptime(date_str, STANDARD_DATA_DATE_FORMAT)
    STR_TO_DATE_CACHE[date_str] = datetime_obj
    return datetime_obj


class PipelineSummary:
    '''This class represents the summary for a pipeline execution, and holds
    metadata such as the number of data points integrated, the start and end
    date, among other information.

    Args:
        data_points_count (int): The number of data points integrated
        start_date (datetime): The earliest date found (must be in YYYY-MM-DD format)
        end_date (datetime): The latest date found (must be in YYYY-MM-DD format)
        field_ids (Set[str]): The list of all fields integrated
        mapped_locations (Set[str]): The list of all locations integrated
        unmatched_locations (Set[str]): The list of all unmatched locations
            integrated
    '''

    def __init__(
        self,
        data_points_count: int,
        start_date: datetime,
        end_date: datetime,
        field_ids: Set[str],
        mapped_locations: Set[str],
        unmatched_locations: Set[str],
    ):
        self.data_points_count = data_points_count
        self.start_date = start_date
        self.end_date = end_date
        self.field_ids = field_ids
        self.mapped_locations = mapped_locations
        self.unmatched_locations = unmatched_locations

    def to_dict(self) -> dict:
        return {
            'data_points_count': self.data_points_count,
            'start_date': datetime.strftime(self.start_date, STANDARD_DATA_DATE_FORMAT),
            'end_date': datetime.strftime(self.end_date, STANDARD_DATA_DATE_FORMAT),
            'mapped_locations_count': len(self.mapped_locations),
            'unmatched_locations_count': len(self.unmatched_locations),
            'fields_count': len(self.field_ids),
        }


class PipelineSummaryAggregator:
    '''This class is used to aggregate multiple pipeline summaries. We
    use this class to generate a pipeline summary for each datsource
    being processed. This class also keeps track of a global summary for
    the entire pipeline, by computing aggregate data across *all* datasources
    (such as the total number of unique indicators integrated, the overall
    start and end date of the full pipeline, etc.)
    '''

    def __init__(self):
        self.summaries_per_source: Dict[str, PipelineSummary] = {}
        self.global_summary: Optional[PipelineSummary] = None

    def _update_global_summary(self) -> None:
        '''Iterate over all `self.summaries_per_source` and reconstruct the
        global pipeline summary.
        '''
        total_data_points = 0
        global_start_date = MAX_DATE
        global_end_date = MIN_DATE
        all_field_ids = set()
        all_mapped_locations = set()
        all_unmatched_locations = set()

        for source in self.summaries_per_source:
            summary: PipelineSummary = self.summaries_per_source[source]
            global_start_date = min(global_start_date, summary.start_date)
            global_end_date = max(global_end_date, summary.end_date)
            total_data_points += summary.data_points_count
            all_field_ids.update(summary.field_ids)
            all_mapped_locations.update(summary.mapped_locations)
            all_unmatched_locations.update(summary.unmatched_locations)

        self.global_summary = PipelineSummary(
            data_points_count=total_data_points,
            start_date=global_start_date,
            end_date=global_end_date,
            field_ids=all_field_ids,
            mapped_locations=all_mapped_locations,
            unmatched_locations=all_unmatched_locations,
        )

    def add_datasource(
        self,
        source: str,
        metadata_digest_file: str,
        mapped_locations_file: str,
        unmatched_locations_file: str,
    ) -> None:
        '''Add a datasource to our pipeline summaries. Use the given files to
        extract metadata about the pipeline run for this datasource.

        Args:
            source (str): The datasource we are adding
            metadata_digest_file (str): The full file path to the metadata digest file
            mapped_locations_file (str): The full file path to the mapped locations file
            unmatched_locations_file (str): The full file path to the unmatched
                locations file
        '''
        data_points_count = 0
        field_ids = set()
        start_date = MAX_DATE
        end_date = MIN_DATE
        mapped_locations = set()
        unmatched_locations = set()

        # process the metadata_digest_file to get total datapoints and number
        # of indicators
        with open(metadata_digest_file, 'r') as indicator_digest:
            reader = DictReader(indicator_digest)
            for row in reader:
                data_points_count += int(row['count'])
                start_date = min(start_date, str_to_datetime(row['start_date']))
                end_date = max(end_date, str_to_datetime(row['end_date']))
                field_ids.add(row['indicator_id'])

        # gather all the mapped locations (using the canonical locations, because
        # we want to gather the locations as they will appear in our platform)
        with open(mapped_locations_file, 'r') as mapped_locations_digest:
            reader = DictReader(mapped_locations_digest)
            for row in reader:
                location_parts = [
                    value
                    for [colname, value] in row.items()
                    if colname.startswith(CANONICAL_LOCATION_PREFIX)
                ]
                mapped_locations.add('__'.join(location_parts))

        # gather all the unmatched locations (using the raw locations, because we
        # want to gather the locations as they appeared in the datasource)
        with open(unmatched_locations_file, 'r') as unmatched_locations_digest:
            reader = DictReader(unmatched_locations_digest)
            for row in reader:
                location_parts = [
                    value
                    for [colname, value] in row.items()
                    if colname.startswith(RAW_LOCATION_PREFIX)
                ]
                unmatched_locations.add('__'.join(location_parts))

        summary = PipelineSummary(
            data_points_count=data_points_count,
            start_date=start_date,
            end_date=end_date,
            field_ids=field_ids,
            mapped_locations=mapped_locations,
            unmatched_locations=unmatched_locations,
        )
        self.summaries_per_source[source] = summary
        self._update_global_summary()

    def write_digest_summaries_to_postgres(self, db_session) -> None:
        generation_datetime = datetime.utcnow()
        num_rows_written = 0

        with Transaction(get_session=lambda: db_session) as transaction:
            # add an entry for every datasource
            for source, summary in self.summaries_per_source.items():
                transaction.add_or_update(
                    PipelineRunMetadata(
                        source=source,
                        generation_datetime=generation_datetime,
                        digest_metadata=summary.to_dict(),
                    )
                )
                num_rows_written += 1
                LOG.info('Writing summary for %s to postgres', source)

            # add the global pipeline summary
            if self.global_summary:
                transaction.add_or_update(
                    PipelineRunMetadata(
                        source=GLOBAL_PIPELINE_SUMMARY_SOURCE,
                        generation_datetime=generation_datetime,
                        digest_metadata=self.global_summary.to_dict(),
                    )
                )
                num_rows_written += 1
                LOG.info('Writing global summary row to postgres')

        LOG.info('Successfully wrote %s rows to postgres', num_rows_written)


def write_to_db(
    datasources: List[str],
    dir_path_template: str,
    metadata_digest_file: str,
    mapped_locations_file: str,
    unmatched_locations_file: str,
    db_session,
) -> None:
    # iterate over all datasources and collect the pipeline summary data
    pipeline_aggregator = PipelineSummaryAggregator()
    for source in datasources:
        pipeline_aggregator.add_datasource(
            source=source,
            metadata_digest_file=get_full_file_path(
                dir_path_template, source, metadata_digest_file
            ),
            mapped_locations_file=get_full_file_path(
                dir_path_template, source, mapped_locations_file
            ),
            unmatched_locations_file=get_full_file_path(
                dir_path_template, source, unmatched_locations_file
            ),
        )

    # write all the summary data to postgres
    pipeline_aggregator.write_digest_summaries_to_postgres(db_session)


def main():
    Flags.PARSER.add_argument(
        '--sources', type=str, nargs='*', required=True, help='List of datasources'
    )
    Flags.PARSER.add_argument(
        '--source_out_dir',
        type=str,
        required=True,
        help=(
            'Path for the datasource `out` dir. The string should be a template '
            'including the token ##SOURCE## which will be dynamically replaced with '
            'a source name from the `sources` list.'
        ),
    )
    Flags.PARSER.add_argument(
        '--metadata_digest_file',
        type=str,
        required=True,
        help='File containing metadata about indicators',
    )
    Flags.PARSER.add_argument(
        '--mapped_locations_file',
        type=str,
        required=True,
        help='File containing the maappped locations metadataa',
    )
    Flags.PARSER.add_argument(
        '--unmatched_locations_file',
        type=str,
        required=True,
        help='File containing the unmatched locations metadata',
    )
    Flags.PARSER.add_argument(
        '--deployment_names',
        type=str,
        nargs='*',
        required=False,
        default=[''],
        help='Name of deployment (must be a valid roledef)',
    )
    Flags.PARSER.add_argument(
        '--run_locally',
        action='store_true',
        required=False,
        default=False,
        help=(
            'Enable this to test things locally. Your'
            'DATABASE_URL env variable will be used'
        ),
    )
    Flags.InitArgs()

    datasources: List[str] = Flags.ARGS.sources
    dir_path_template = Flags.ARGS.source_out_dir
    metadata_digest_file = Flags.ARGS.metadata_digest_file
    mapped_locations_file = Flags.ARGS.mapped_locations_file
    unmatched_locations_file = Flags.ARGS.unmatched_locations_file

    LOG.info('Adding pipeline run metadata for datasources %s', datasources)

    if Flags.ARGS.run_locally:
        db_uri = get_local_db_uri(os.getenv('ZEN_ENV'))
        sessions = [get_session(db_uri)]
    else:
        sessions = [
            get_db_session(deployment_name)
            for deployment_name in Flags.ARGS.deployment_names
        ]

    for db_session in sessions:
        write_to_db(
            datasources,
            dir_path_template,
            metadata_digest_file,
            mapped_locations_file,
            unmatched_locations_file,
            db_session,
        )

    return 0


if __name__ == '__main__':
    sys.exit(main())
