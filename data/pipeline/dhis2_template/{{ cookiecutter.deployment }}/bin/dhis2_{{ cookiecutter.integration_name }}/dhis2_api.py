from datetime import datetime
from typing import Set

from data.pipeline.dhis2.date_periods import DHIS2Periods
from data.pipeline.dhis2.options import DhisOptions
from data.pipeline.dhis2.util import get_data_fetch_time_range

from util.credentials.passphrase import get_by_id
from web.server.configuration.instance import load_instance_configuration_from_file

# Login information
PASSPHRASE_ID = {{cookiecutter.passphrase_id}}
instance_configuration = load_instance_configuration_from_file()
conduit_token = instance_configuration.get('conduit_token', '')
credentials = get_by_id(PASSPHRASE_ID, conduit_token)

# Start and end date configuration
DATE_FORMAT = '%Y%m'
data_start_date = datetime.strptime('{{cookiecutter.data_start_date}}', DATE_FORMAT)
START_DATE, END_DATE = get_data_fetch_time_range(data_start_date, months=36)
DHIS2_PERIODS = DHIS2Periods(START_DATE, END_DATE)

NATION = '{{cookiecutter.nation}}'

# Configuration Regarding request frequency and size
MAX_CONCURRENT_REQUESTS = 5
SHARD_DATES_SIZE = 20
SHARD_INDICATOR_SIZE = 7
SHARD_DATES_SIZE_REPORTING = 100

# Configuration for the datasource and field prefix
DATA_SOURCE = 'dhis2_{{cookiecutter.integration_name}}'
SOURCE_PREFIX = {% if cookiecutter.prefix %}'{{cookiecutter.prefix}}'{%else%}None{% endif %}
DEFAULT_DISAGGREGATIONS = '{{cookiecutter.default_disaggregation}}'


DHIS_OPTIONS = DhisOptions(
    username=credentials['username'],
    password=credentials['material']['password'],
    hostpath='{{ cookiecutter.dhis2_domain }}{% if cookiecutter.instance_name %}/{% endif %}{{cookiecutter.instance_name}}',
    base_fields=['id', 'displayName', 'shortName'],
    date_format='%Y%m',
    url_pattern='https://%s/api/%s',
    url='https://{{cookiecutter.dhis2_domain}}',
    instance_name='{{cookiecutter.instance_name}}',
)

EXCLUSION_LIST: Set[str] = set()
RESAMPLE_OVERRIDE: Set[str] = set()
FETCH_ONLY: Set[str] = set()

field_overlap = EXCLUSION_LIST & FETCH_ONLY
assert (
    field_overlap == set()
), f'Field(s) cannot be in both exclusion list and fetch only: {field_overlap}'
