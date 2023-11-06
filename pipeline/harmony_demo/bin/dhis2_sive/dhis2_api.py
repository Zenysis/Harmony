from datetime import datetime
from typing import Set

from data.pipeline.dhis2.date_periods import DHIS2Periods
from data.pipeline.dhis2.options import DhisOptions
from data.pipeline.dhis2.util import get_data_fetch_time_range


# Start and end date configuration
DATE_FORMAT = '%Y%m'
data_start_date = datetime.strptime('202305', DATE_FORMAT)
START_DATE, END_DATE = get_data_fetch_time_range(data_start_date, months=36)
DHIS2_PERIODS = DHIS2Periods(START_DATE, END_DATE)

NATION = 'LJX5GuypkKy'

# Configuration Regarding request frequency and size
MAX_CONCURRENT_REQUESTS = 5
SHARD_DATES_SIZE = 20
SHARD_INDICATOR_SIZE = 7
SHARD_DATES_SIZE_REPORTING = 100

# Configuration for the datasource and field prefix
DATA_SOURCE = 'dhis2_sive'
SOURCE_PREFIX = 'sive'
DEFAULT_DISAGGREGATIONS = 'HllvX50cXC0'


DHIS_OPTIONS = DhisOptions(
    username="elisio.freitas",
    password="vad9qhe*gvx6pbg1NQR",
    hostpath='sis.misau.gov.mz/sive',
    base_fields=['id', 'displayName', 'shortName'],
    date_format='%Y%m',
    url_pattern='https://%s/api/%s',
    url='https://sis.misau.gov.mz',
    instance_name='sive',
)

EXCLUSION_LIST: Set[str] = set()
RESAMPLE_OVERRIDE: Set[str] = set()
FETCH_ONLY: Set[str] = set()

field_overlap = EXCLUSION_LIST & FETCH_ONLY
assert (
    field_overlap == set()
), f'Field(s) cannot be in both exclusion list and fetch only: {field_overlap}'
