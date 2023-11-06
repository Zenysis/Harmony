from datetime import datetime, timedelta

import pandas
from dateutil.relativedelta import relativedelta


def generate_special_periods(
    start: str, end: str, splitter: str, max_period: int
) -> list:
    '''
    This functions generates periods between two reporting period ranges. Only for weekly
    and quarterly periods

    args
    ------
    start: The start of the reporting period in format like: 2022Q1
    end: The end of the reporting period in format like: 2022W34
    splitter: The letter in the period to split the year from the period number:
                For example, 2022Q1 uses `Q` as the splitter. 2022W34 uses `W` as the splitter
    max_period: Number of periods in a year for a specific splitter.
    '''
    start_year, start_period = start.split(splitter)
    end_year, end_period = end.split(splitter)

    periods = []

    if start_year == end_year:
        for week in range(int(start_period), int(end_period) + 1):
            periods.append(f"{start_year}{splitter}{week}")
    else:
        start_year = int(start_year)
        end_year = int(end_year)
        assert end_year > start_year, "End year has to be greater start year"
        start_period = int(start_period)
        c_year = start_year
        while c_year <= end_year:
            if c_year > start_year:
                start_period = 0
            while start_period < max_period + 1:
                periods.append(f'{c_year}{splitter}{start_period}')
                start_period += 1
            c_year += 1
    return periods


def generate_regular_periods(start: str, end: str, freq: str) -> list:
    '''
    This functions generates periods between two reporting period ranges.
    Only for daily, monthly, and yearly periods

    args
    ------
    start: The start of the reporting period in format like: 2022Q1
    end: The end of the reporting period in format like: 2022W34
    freq: Whether it is daily, monthly or yearly. Takes first letter of frequency (d,m,y)
    '''
    period_date_formats = {'d': '%Y%m%d', 'm': '%Y%m', 'y': '%Y'}

    return [
        period.strftime(period_date_formats[freq])
        for period in pandas.date_range(
            datetime.strptime(start, period_date_formats[freq]),
            datetime.strptime(end, period_date_formats[freq]),
            freq=freq,
        )
    ]


def generate_weekly_periods(start: str, end: str) -> list:
    '''
    Given a start and end period, this function will return a list of covered weekly periods

    args
    -----
    start: The first week of the reporting period
    end: The last week of the reporting period
    '''
    splitter = 'W'
    max_period = 52

    return generate_special_periods(start, end, splitter, max_period)


def generate_quarterly_periods(start: str, end: str) -> list:
    '''
    Given a start and end period, this function will return a list of covered quarterly periods

    args
    -----
    start: The first week of the reporting period
    end: The last week of the reporting period
    '''
    splitter = 'Q'
    max_period = 4

    return generate_special_periods(start, end, splitter, max_period)


def generate_six_monthly_periods(start: str, end: str) -> list:
    '''
    Given a start and end period, this function will return a list of covered six monthly periods

    args
    -----
    start: The first week of the reporting period
    end: The last week of the reporting period
    '''
    splitter = 'S'
    max_period = 2

    return generate_special_periods(start, end, splitter, max_period)


def generate_monthly_periods(start: str, end: str):
    '''
    Given a start and end period, this function will return a list of covered monthly periods

    args
    -----
    start: The first week of the reporting period
    end: The last week of the reporting period
    '''
    freq = 'm'
    formatter = "%Y%m"
    end = datetime.strptime(end, formatter) + relativedelta(months=1)
    end = end.strftime(formatter)
    return generate_regular_periods(start, end, freq)


def generate_daily_periods(start: str, end: str):
    '''
    Given a start and end period, this function will return a list of covered daily periods

    args
    -----
    start: The first week of the reporting period
    end: The last week of the reporting period
    '''
    freq = 'd'
    formatter = "%Y%m%d"
    end = datetime.strptime(end, formatter) + timedelta(days=1)
    end = end.strftime(formatter)
    return generate_regular_periods(start, end, freq)


def generate_yearly_periods(start: str, end: str):
    '''
    Given a start and end period, this function will return a list of covered yearly periods

    args
    -----
    start: The first week of the reporting period
    end: The last week of the reporting period
    '''
    freq = 'y'
    formatter = "%Y"
    end = datetime.strptime(end, formatter) + relativedelta(years=1)
    end = end.strftime(formatter)
    return generate_regular_periods(start, end, freq)
