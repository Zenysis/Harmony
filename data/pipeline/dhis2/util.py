import importlib
from datetime import datetime, timedelta

import pandas as pd
from dateutil.relativedelta import relativedelta

# Supported reported rates ordered from least granular to most granular
REPORTING_RATE_ORDER = [
    'Yearly',
    'SixMonthly',
    'Quarterly',
    'Monthly',
    'Weekly',
    'Daily',
]
# Set of supported reporting rates
SUPPORTED_REPORTING_RATES = set(REPORTING_RATE_ORDER)

# These value types cannot be aggregated or represented in our platform
# and therefore cannot be fetched
EXCLUDED_VALUE_TYPES = {
    'DATE',
    'LONG_TEXT',
    'TEXT',
    'EMAIL',
    'PHONE_NUMBER',
    'FILE_RESOURCE',
    'ORGANISATION_UNIT',
    'TIME',
    'IMAGE',
    'URL',
    'USERNAME',
}
# These aggregation types should always be resampled
RESAMPLE_AGGREGATION_TYPES = {'AVERAGE_SUM_ORG_UNIT'}
# The metrics on datasets that DHIS2 creates
REPORTING_METRICS = [
    'REPORTING_RATE_ON_TIME',
    'REPORTING_RATE',
    'ACTUAL_REPORTS',
    'ACTUAL_REPORTS_ON_TIME',
    'EXPECTED_REPORTS',
]


def load_module_by_filepath(filepath, module_name):
    source_loader = importlib.machinery.SourceFileLoader(
        module_name,
        filepath,
    )
    return source_loader.load_module()


def get_data_fetch_time_range(data_start_date, months=1):
    '''
    Data is submitted to DHIS2 and validated for the individual data sources (HMIS,
    IDSR, SISCOM, etc.) by the 16th of each month. The TWG has requested that we do not
    display data for the previous month untl the 16th of the following month to ensure
    the data has been fully validated. They do not want us displaying data that has not
    yet been validated (even though there should be support in DHIS2 to segment off
    non-validated data).
    '''
    today = datetime.today()

    month_start = today - timedelta(days=today.day - 1)

    month_difference = relativedelta(months=months)
    start_date = month_start - month_difference
    if today.day in [15, 16]:
        start_date = month_start - relativedelta(months=11)
    if start_date < data_start_date or is_last_friday_of_quarter(today):
        start_date = data_start_date
    return start_date, today


def is_last_friday_of_quarter(date):
    quarter_end = pd.to_datetime(
        date + pd.tseries.offsets.QuarterEnd(startingMonth=3)
    ).date()
    return (
        quarter_end.month == date.month
        and quarter_end.day - date.day < 7
        and date.weekday() in [4, 5]
    )


def get_data_fetch_end_date():
    '''
    Data is submitted to DHIS2 and validated for the individual data sources (HMIS,
    IDSR, SISCOM, etc.) by the 16th of each month. The TWG has requested that we do not
    display data for the previous month untl the 16th of the following month to ensure
    the data has been fully validated. They do not want us displaying data that has not
    yet been validated (even though there should be support in DHIS2 to segment off
    non-validated data).
    '''
    today = datetime.today()

    # Set the end date to be the last day of the previous month.
    end_date = today - timedelta(days=today.day)

    # If today is before the 16th of the month, we cannot yet use data from the previous
    # month and must use data from 2 months ago.
    if today.day < 16:
        end_date = end_date - timedelta(days=end_date.day)
    return end_date
