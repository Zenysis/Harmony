#!/usr/bin/env python
'''
Populate pipeline run metadata db rows.
Since the metadata we want to collect is still not finalized, store the metadata
in a dictionary. The metadata stored currently is the aggregated data from the
metadata digest files created in the 10_fill_dimension_data pipeline step.

TODO: Add other metadata such as # empty rows, # invalid dates. See
process_csv step logs and error handler for ideas.
'''
from abc import ABC, abstractmethod
from csv import DictReader
from datetime import datetime
import os
import sys
from typing import Dict, List, Optional, Set, Union

from croniter import croniter
from pylib.base.flags import Flags

from config.pipeline_sources import PIPELINE_CONFIG
from config.system import STANDARD_DATA_DATE_FORMAT
from db.postgres.common import get_db_session, get_local_db_uri, get_session
from log import LOG
from models.alchemy.pipeline_runs import PipelineRunMetadata
from web.server.data.data_access import Transaction

SOURCE_DIR_TOKEN = '##SOURCE##'
MAX_DATE = datetime.strptime('3000-12-31', STANDARD_DATA_DATE_FORMAT)
MIN_DATE = datetime.strptime('0001-01-01', STANDARD_DATA_DATE_FORMAT)
STR_TO_DATE_CACHE: Dict[str, datetime] = {}
GLOBAL_PIPELINE_SUMMARY_SOURCE = 'ALL_SOURCES'


def get_full_file_path(
    dir_template: str, datasource: str, filename: Optional[str]
) -> Optional[str]:
    '''Convert a directory template of the form 'a/b/##SOURCE##/b/c' to a file path
    that replaces the `##SOURCE##` token and appends the filename. So the returned
    string would be something like: 'a/b/hmis_malaria/b/c/some_filename.csv'
    '''
    if not filename:
        return None

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


class BasePipelineSummary(ABC):
    @property
    @abstractmethod
    def failed(self):  # pylint: disable=invalid-name
        pass

    def __init__(self):
        self.start_ts = os.environ.get('PIPELINE_START_TS')

    @property
    def next_run(self):
        crontabs = os.environ.get('PIPELINE_CRONTAB', '')
        if not (crontabs and self.start_ts):
            return None
        next_times = []
        for crontab in crontabs.split('\n'):
            crontab = crontab.strip()
            if croniter.is_valid(crontab):
                next_times.append(croniter(crontab).get_next(datetime))
        return min(next_times) if next_times else None

    def to_dict(self) -> dict:
        return (
            dict(
                next_run=self.next_run.isoformat(),
                start_ts=self.start_ts,
                failed=self.failed,
            )
            if self.next_run and self.start_ts
            else {'failed': self.failed}
        )


class FailedPipelineSummary(BasePipelineSummary):
    failed = True


class PipelineSummary(BasePipelineSummary):
    '''This class represents the summary for a pipeline execution, and holds
    metadata such as the number of data points integrated and the start and end
    date among other information.

    Args:
        data_points_count (int): The number of data points integrated
        start_date (datetime): The earliest date found (must be in YYYY-MM-DD format)
        end_date (datetime): The latest date found (must be in YYYY-MM-DD format)
        field_ids (Set[str]): The list of all fields integrated
    '''

    failed = False

    def __init__(
        self,
        data_points_count: int,
        start_date: datetime,
        end_date: datetime,
        field_ids: Set[str],
    ):
        self.data_points_count = data_points_count
        self.start_date = start_date
        self.end_date = end_date
        self.field_ids = field_ids

        super().__init__()

    def to_dict(self) -> dict:
        result = super().to_dict()
        result.update(
            {
                'data_points_count': self.data_points_count,
                'start_date': datetime.strftime(
                    self.start_date, STANDARD_DATA_DATE_FORMAT
                ),
                'end_date': datetime.strftime(self.end_date, STANDARD_DATA_DATE_FORMAT),
                'fields_count': len(self.field_ids),
            }
        )
        return result


class BasePipelineSummaryAggregator(ABC):
    '''This class is used to aggregate multiple pipeline summaries. We
    use this class to generate a pipeline summary for each datsource
    being processed. This class also keeps track of a global summary for
    the entire pipeline, by computing aggregate data across *all* datasources
    (such as the total number of unique indicators integrated, the overall
    start and end date of the full pipeline, etc.)
    '''

    def __init__(self):
        self.summaries_per_source: Dict[str, PipelineSummary] = {}
        self.global_summary: Optional[BasePipelineSummary] = None

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


class FailedPiplineSummaryAggregator(BasePipelineSummaryAggregator):
    def __init__(self):
        super().__init__()
        self.global_summary = FailedPipelineSummary()


class PipelineSummaryAggregator(BasePipelineSummaryAggregator):
    def _update_global_summary(self) -> None:
        '''Iterate over all `self.summaries_per_source` and reconstruct the
        global pipeline summary.
        '''
        total_data_points = 0
        global_start_date = MAX_DATE
        global_end_date = MIN_DATE
        all_field_ids = set()

        for source in self.summaries_per_source:
            summary: PipelineSummary = self.summaries_per_source[source]
            global_start_date = min(global_start_date, summary.start_date)
            global_end_date = max(global_end_date, summary.end_date)
            total_data_points += summary.data_points_count
            all_field_ids.update(summary.field_ids)

        self.global_summary = PipelineSummary(
            data_points_count=total_data_points,
            start_date=global_start_date,
            end_date=global_end_date,
            field_ids=all_field_ids,
        )

    def add_datasource(
        self,
        source: str,
        metadata_digest: Union[str, Dict[str, str]],
        is_metadata_from_druid: bool,
    ) -> None:
        '''Add a datasource to our pipeline summaries. Use the given files to
        extract metadata about the pipeline run for this datasource.

        Args:
            source (str): The datasource we are adding
            metadata_digest_file (str or a dictionary of string to string):
                The full file path to the metadata digest file or
                a list of metadata attatched to each datasource used for the druid option
            is_metadata_from_druid (bool): Whether the metadata is from fill_dimension_data
                or queried from druid
        '''
        data_points_count = 0
        field_ids = set()
        start_date = MAX_DATE
        end_date = MIN_DATE

        # process the metadata_digest_file to get total datapoints and number
        # of indicators
        if is_metadata_from_druid:
            for row in metadata_digest:
                data_points_count += int(row['count'])
                start_date = min(start_date, str_to_datetime(row['start_date']))
                end_date = max(end_date, str_to_datetime(row['end_date']))
                field_ids.add(row['indicator_id'])
        else:
            with open(metadata_digest, 'r') as indicator_digest:
                reader = DictReader(indicator_digest)
                for row in reader:
                    data_points_count += int(row['count'])
                    start_date = min(start_date, str_to_datetime(row['start_date']))
                    end_date = max(end_date, str_to_datetime(row['end_date']))
                    field_ids.add(row['indicator_id'])

        summary = PipelineSummary(
            data_points_count=data_points_count,
            start_date=start_date,
            end_date=end_date,
            field_ids=field_ids,
        )
        self.summaries_per_source[source] = summary
        self._update_global_summary()


def get_digest_map(
    metadata_digest_file: str, datasources: List[str]
) -> Dict[str, List[Dict[str, str]]]:
    '''
    Add all the Metadata Digest Information to a Mapping from datasource to
    lists of digest metadata
    '''
    metadata_digest = {}
    for source in datasources:
        metadata_digest[source] = []

    # Some data needs to have more granular permissions than a single datasource.
    # So there are source values stored in druid that are not equal to the
    # source_id. Create a mapping from the druid sources to the source_id.
    druid_source_lookup = {}
    for source in PIPELINE_CONFIG:
        if source.source_id in metadata_digest:
            for druid_source in source.druid_sources:
                druid_source_lookup[druid_source] = source.source_id

    with open(metadata_digest_file, 'r') as indicator_digest:
        reader = DictReader(indicator_digest)
        missing_sources = set()
        for row in reader:
            source = row['source']
            if source in druid_source_lookup:
                metadata_digest[druid_source_lookup[source]].append(row)
            elif source in metadata_digest:
                metadata_digest[source].append(row)
            else:
                missing_sources.add(source)
        for missing_source in missing_sources:
            LOG.warning(
                "Could not find datasource: %s in list of datasources", missing_source
            )
    return metadata_digest


def write_to_db(
    datasources: List[str],
    dir_path_template: str,
    metadata_digest_file: str,
    db_session,
    is_metadata_from_druid: bool,
) -> None:
    # iterate over all datasources and collect the pipeline summary data
    if is_metadata_from_druid:
        metadata_digest_map = get_digest_map(metadata_digest_file, datasources)

    pipeline_aggregator = PipelineSummaryAggregator()
    for source in datasources:
        if is_metadata_from_druid:
            digest_file = metadata_digest_map[source]
        else:
            digest_file = get_full_file_path(
                dir_path_template, source, metadata_digest_file
            )

        pipeline_aggregator.add_datasource(
            source=source,
            metadata_digest=digest_file,
            is_metadata_from_druid=is_metadata_from_druid,
        )

    # write all the summary data to postgres
    pipeline_aggregator.write_digest_summaries_to_postgres(db_session)


def write_failure_to_db(db_session):
    FailedPiplineSummaryAggregator().write_digest_summaries_to_postgres(db_session)


def main():
    Flags.PARSER.add_argument(
        '--failure',
        required=False,
        action='store_true',
        default=False,
        help='Only store the fact of a failed pipeline run',
    )
    Flags.PARSER.add_argument(
        '--sources', type=str, nargs='*', required=False, help='List of datasources'
    )
    Flags.PARSER.add_argument(
        '--source_out_dir',
        type=str,
        required=False,
        help=(
            'Path for the datasource `out` dir. The string should be a template '
            'including the token ##SOURCE## which will be dynamically replaced with '
            'a source name from the `sources` list.'
        ),
    )
    Flags.PARSER.add_argument(
        '--metadata_digest_file',
        type=str,
        required=False,
        help='File containing metadata about indicators',
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
    Flags.PARSER.add_argument(
        '--druid',
        action='store_true',
        required=False,
        default=False,
        help=(
            'Enable this to fetch metadata from druid, '
            'enables script to work for deployments that use experimental parser'
        ),
    )
    Flags.InitArgs()

    if Flags.ARGS.run_locally:
        db_uri = get_local_db_uri(os.getenv('ZEN_ENV'))
        sessions = [get_session(db_uri)]
    else:
        sessions = [
            get_db_session(deployment_name)
            for deployment_name in Flags.ARGS.deployment_names
        ]

    if Flags.ARGS.failure:
        for db_session in sessions:
            write_failure_to_db(db_session)
    else:
        required_args = [
            'sources',
            'source_out_dir',
            'metadata_digest_file',
        ]

        missing_args = list(
            map(
                lambda argname: '--' + argname,
                filter(
                    lambda argname: not getattr(Flags.ARGS, argname, None),
                    required_args,
                ),
            )
        )
        if missing_args:
            Flags.PARSER.error('Must specify ' + ', '.join(missing_args))

        datasources: List[str] = Flags.ARGS.sources
        dir_path_template = Flags.ARGS.source_out_dir
        metadata_digest_file = Flags.ARGS.metadata_digest_file

        LOG.info('Adding pipeline run metadata for datasources %s', datasources)

        for db_session in sessions:
            write_to_db(
                datasources,
                dir_path_template,
                metadata_digest_file,
                db_session,
                Flags.ARGS.druid,
            )

    return 0


if __name__ == '__main__':
    sys.exit(main())
