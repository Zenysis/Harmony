from datetime import datetime
from unittest.mock import patch

from data.pipeline.dhis2.util import (
    get_data_fetch_time_range,
    is_last_friday_of_quarter,
)


def test_not_friday_is_last_friday_of_quarter():
    date = datetime(2022, 12, 13)
    assert not is_last_friday_of_quarter(date)


def test_not_last_friday_is_last_friday_of_quarter():
    date = datetime(2022, 10, 21)
    assert not is_last_friday_of_quarter(date)


def test_is_last_friday_of_quarter():
    date = datetime(2022, 3, 25)
    assert is_last_friday_of_quarter(date)


@patch('data.pipeline.dhis2.util.datetime')
def test_get_data_fetch_time_range_one_month(m_datetime):
    data_start_date = datetime(2000, 1, 1)
    m_datetime.today.return_value = datetime(2022, 10, 25)
    expected_start_date = datetime(2022, 9, 1)
    start_date, _ = get_data_fetch_time_range(data_start_date)
    assert expected_start_date == start_date


@patch('data.pipeline.dhis2.util.datetime')
def test_get_data_fetch_time_range_start_date_before_data_start_date(m_datetime):
    data_start_date = datetime(2022, 1, 1)
    m_datetime.today.return_value = datetime(2022, 10, 25)
    start_date, _ = get_data_fetch_time_range(data_start_date, 24)
    assert data_start_date == start_date


@patch('data.pipeline.dhis2.util.datetime')
def test_get_data_fetch_time_range_end_quarter(m_datetime):
    data_start_date = datetime(2020, 1, 1)
    m_datetime.today.return_value = datetime(2022, 3, 25)
    start_date, _ = get_data_fetch_time_range(data_start_date, 24)
    assert data_start_date == start_date


@patch('data.pipeline.dhis2.util.datetime')
def test_get_data_fetch_time_range_15_16_date(m_datetime):
    data_start_date = datetime(2020, 1, 1)
    m_datetime.today.return_value = datetime(2022, 10, 15)
    expected_start_date = datetime(2021, 11, 1)
    start_date, _ = get_data_fetch_time_range(data_start_date, 24)
    assert expected_start_date == start_date
