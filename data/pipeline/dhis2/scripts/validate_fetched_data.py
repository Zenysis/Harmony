#!/usr/bin/env python
import csv
import importlib
import json
import os
import subprocess
import sys
from datetime import datetime

import requests
from pylib.base.flags import Flags

from data.pipeline.dhis2.exceptions import DHIS2ValidationFailedException
from data.pipeline.dhis2.options import DhisOptions
from data.pipeline.dhis2.scripts.fetch_dhis2_data import build_data_element_id_groups
from log import LOG

PATH = (
    'analytics.json?'
    'dimension=dx:%s&'
    'outputIdScheme=UID&'
    'startDate=%s&'
    'endDate=%s'
)

REPORTING_RATE_EXCLUSION = {'FinancialJuly'}
SHARD_SIZE = 35


class Validator:
    '''Class that validates that the totals for the fetched data are the same as those from the analytics API'''

    def __init__(
        self,
        dhis2_options: DhisOptions,
        start_date: datetime,
        end_date: datetime,
        exclude: set = None,
    ):
        self.dhis2_options = dhis2_options
        self.username = dhis2_options.username
        self.password = dhis2_options.password
        self.url_pattern = dhis2_options.url_pattern
        self.hostpath = dhis2_options.hostpath
        self.auth = (self.username, self.password)
        self.start_date = start_date
        self.end_date = end_date
        self.unmatched = None
        self.exclude = exclude

    def get_indicator_summaries(self):
        '''Fetches indicator totals from API and saves them to a file.'''

        data_elements_by_reporting_rate = build_data_element_id_groups(
            json.load(open(Flags.ARGS.input_indicator_filepath)),
            self.exclude,
            set(),
            False,
            reporting_rate_exclusion=REPORTING_RATE_EXCLUSION,
        )
        reporting_rate_map = {}
        for reporting_rate in data_elements_by_reporting_rate:
            reporting_rate_map.setdefault(reporting_rate, [])
            start_shard = 0
            end_shard = SHARD_SIZE
            indicators = sorted(list(data_elements_by_reporting_rate[reporting_rate]))
            num_de = len(indicators)
            base_url = self.url_pattern % (self.hostpath, PATH)
            while end_shard <= num_de:
                url = base_url % (
                    ";".join(indicators[start_shard:end_shard]),
                    self.start_date.strftime("%Y-%m-%d"),
                    self.end_date.strftime("%Y-%m-%d"),
                )
                response = requests.get(url, auth=self.auth)
                response.raise_for_status()
                reporting_rate_map[reporting_rate] += response.json().get('rows', [])
                start_shard = end_shard
                end_shard = start_shard + SHARD_SIZE
        self._write_summary(reporting_rate_map)
        return reporting_rate_map

    def compare_fetched_data(self):
        '''Compares fetched totals with totals from fetched data'''
        file_name_map = {
            'Monthly': 'fetched_data_monthly.csv.lz4',
            'Daily': 'fetched_data_daily.csv.lz4',
            'Yearly': 'fetched_data_yearly.csv.lz4',
            'Quarterly': 'fetched_data_quarterly.csv.lz4',
            'Weekly': 'fetched_data_weekly.csv.lz4',
            'SixMonthly': 'fetched_data_six_monthly.csv.lz4',
        }
        resample_file_name_map = {
            'Monthly': 'resample_fetched_data_monthly.csv.lz4',
            'Daily': 'resample_fetched_data_daily.csv.lz4',
            'Yearly': 'resample_fetched_data_yearly.csv.lz4',
            'Quarterly': 'resample_fetched_data_quarterly.csv.lz4',
            'Weekly': 'resample_fetched_data_weekly.csv.lz4',
            'SixMonthly': 'resample_fetched_data_six_monthly.csv.lz4',
        }
        LOG.info("Fetching Summary")
        summaries = self.get_indicator_summaries()
        LOG.info("Summary Fetched successfully")
        self.unmatched = {}
        file_map = resample_file_name_map if Flags.ARGS.resample else file_name_map
        for reporting_rate in summaries:
            self.unmatched.setdefault(reporting_rate, [])
            for indicator, api_total in summaries[reporting_rate]:
                LOG.debug(f"Validating fetched totals for indicator: {indicator}")
                bash_command = f"""lz4cat -f {Flags.ARGS.input_directory}/{file_map[reporting_rate]} |  grep {indicator} | cut -f7 -d ',' | awk '{{n += $1}}; END{{print n}}'"""
                output = subprocess.check_output(bash_command, shell=True)
                try:
                    indicator_sum = float(output.decode('utf-8').strip())
                except ValueError as e:
                    LOG.debug(str(e))
                    indicator_sum = 0
                api_total = float(api_total)
                if indicator_sum != api_total:
                    self.unmatched[reporting_rate].append(
                        {
                            'name': indicator,
                            'fetched_data': indicator_sum,
                            'api_total': api_total,
                            'diff': api_total - indicator_sum,
                        }
                    )

    def write_unmatched_data(self):
        '''Writes unmatched totals to a file'''
        if self.unmatched is not None:
            if not self.unmatched:
                LOG.info("Nothing to write. No data mismatch")
                return
            for reporting_rate in self.unmatched:
                if self.unmatched[reporting_rate]:
                    field_names = list(self.unmatched[reporting_rate][0].keys())
                    filename = (
                        f'unmatched_resample_{reporting_rate.lower()}.csv'
                        if Flags.ARGS.resample
                        else f'unmatched_{reporting_rate.lower()}.csv'
                    )
                    with open(
                        f'{Flags.ARGS.output_directory}/{filename}', 'w'
                    ) as csv_file:
                        writer = csv.DictWriter(csv_file, fieldnames=field_names)
                        writer.writeheader()
                        writer.writerows(self.unmatched[reporting_rate])
        else:
            self.compare_fetched_data()
            self.write_unmatched_data()

    @staticmethod
    def _write_summary(summary: dict):
        with open(
            f'{Flags.ARGS.output_directory}/dhsi2_totals_summary.json', 'w'
        ) as totals_file:
            json.dump(summary, totals_file, indent=2)


def main():
    Flags.PARSER.add_argument(
        '--input_directory',
        type=str,
        required=True,
        help='Directory with newly fetched data',
    )

    Flags.PARSER.add_argument(
        '--output_directory',
        type=str,
        required=True,
        help='Directory in which to write csv with differences',
    )

    Flags.PARSER.add_argument(
        '--api_config_filepath',
        type=str,
        required=True,
        help='Location of api config file.',
    )

    Flags.PARSER.add_argument(
        '--raise_on_failure',
        type=bool,
        required=False,
        default=False,
        help='Whether we should raise a pipeline failure when the validate step fails.',
    )

    Flags.PARSER.add_argument(
        '--resample',
        type=bool,
        required=False,
        default=False,
        help='Whether we should look at resample files instead',
    )

    Flags.PARSER.add_argument(
        '--input_indicator_filepath',
        type=str,
        required=True,
        help='Location of the indicator json file, created in the fetch indicator step',
    )

    Flags.InitArgs()

    api_config_filepath = Flags.ARGS.api_config_filepath
    module_name = os.path.basename(api_config_filepath).replace('-', '_')
    spec = importlib.util.spec_from_loader(
        module_name,
        importlib.machinery.SourceFileLoader(module_name, api_config_filepath),
    )
    dhis2_api_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(dhis2_api_module)

    reporting_rate_exclusion = set(
        getattr(dhis2_api_module, 'REPORTING_RATE_EXCLUSION', [])
    )
    REPORTING_RATE_EXCLUSION.update(reporting_rate_exclusion)

    exclude = getattr(dhis2_api_module, 'EXCLUSION_LIST', set())
    exclude.update(getattr(dhis2_api_module, 'MISC_TO_EXCLUDE', set()))

    validator = Validator(
        dhis2_api_module.DHIS_OPTIONS,
        dhis2_api_module.START_DATE,
        dhis2_api_module.END_DATE,
        exclude=exclude,
    )
    validator.write_unmatched_data()

    if Flags.ARGS.raise_on_failure and validator.unmatched:
        raise DHIS2ValidationFailedException(Flags.ARGS.output_directory)


if __name__ == "__main__":
    sys.exit(main())
