import calendar
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from isoweek import Week
from typing import List

from log import LOG
from collections import defaultdict

DAILY_DATE_FORMAT = '%Y%m%d'
MONTHLY_DATE_FORMAT = '%Y%m'
YEARLY_DATE_FORMAT = '%Y'
FULL_DATE_FORMAT = '%Y-%m-%d %H:%M:%S.0'

WEEKLY_RATE = 'Weekly'
QUARTERLY_RATE = 'Quarterly'
SIX_MONTHLY_RATE = 'SixMonthly'
YEARLY_RATE = 'Yearly'
MONTHLY_RATE = 'Monthly'
DAILY_RATE = 'Daily'


def get_period_reporting_rate(period: str) -> str:
    '''Parse date period string to determine reporting rate'''
    if 'W' in period:
        return WEEKLY_RATE
    if 'Q' in period:
        return QUARTERLY_RATE
    if 'S' in period:
        return SIX_MONTHLY_RATE
    if len(period) == 4:
        return YEARLY_RATE
    if len(period) == 6:
        return MONTHLY_RATE
    if len(period) == 8:
        return DAILY_RATE
    # TODO(isabel): throw error here instead?
    LOG.info(f'WARNING UNSUPPORTED REPORTING RATE \n {period} \n ')
    return None


def get_dates_in_range(
    start_date: datetime, end_date: datetime, reporting_rate: str
) -> List[str]:
    '''Build list of all reporting-rate dates in the given interval'''
    periods = DHIS2Periods(start_date, end_date)
    if reporting_rate == WEEKLY_RATE:
        return periods.Weekly
    if reporting_rate == QUARTERLY_RATE:
        return periods.Quarterly
    if reporting_rate == SIX_MONTHLY_RATE:
        return periods.SixMonthly
    if reporting_rate == YEARLY_RATE:
        return periods.Yearly
    if reporting_rate == MONTHLY_RATE:
        return periods.Monthly
    if reporting_rate == DAILY_RATE:
        return periods.Daily


def get_adjacent_date(date: datetime, reporting_rate: str, diff: int = -1) -> datetime:
    '''Get the date of the <diff> next/previous period for the reporting rate'''
    if reporting_rate == WEEKLY_RATE:
        week_diff = relativedelta(weeks=diff)
        return date + week_diff
    if reporting_rate == QUARTERLY_RATE:
        quarter_diff = relativedelta(months=(3 * diff))
        return date + quarter_diff
    if reporting_rate == SIX_MONTHLY_RATE:
        six_month_diff = relativedelta(months=(6 * diff))
        return date + six_month_diff
    if reporting_rate == YEARLY_RATE:
        return date + relativedelta(years=diff)
    if reporting_rate == MONTHLY_RATE:
        diff = relativedelta(months=diff)
        return date + diff
    if reporting_rate == DAILY_RATE:
        return date + relativedelta(days=diff)


def convert_datetime_to_dhis2_period(date: datetime, reporting_rate: str) -> str:
    '''Construct the DHIS2 period representation of date as reporting_rate'''
    if reporting_rate == WEEKLY_RATE:
        return f'{date.year}W{date.isocalendar()[1]}'
    if reporting_rate == QUARTERLY_RATE:
        quarter = (date.month - 1) // 3 + 1
        return f'{date.year}Q{quarter}'
    if reporting_rate == SIX_MONTHLY_RATE:
        new_six_month = (date.month - 1) // 6 + 1
        return f'{date.year}S{new_six_month}'
    if reporting_rate == YEARLY_RATE:
        return f'{date.year}'
    if reporting_rate == MONTHLY_RATE:
        new_month = str(date.month)
        if len(new_month) < 2:
            new_month = f'0{new_month}'
        return f'{date.year}{new_month}'
    if reporting_rate == DAILY_RATE:
        new_month = str(date.month)
        if len(new_month) < 2:
            new_month = f'0{new_month}'
        new_day = str(date.day)
        if len(new_day) < 2:
            new_day = f'0{new_day}'
        return f'{date.year}{new_month}{new_day}'


def convert_dhis2_period_to_datetime(date_str: str, reporting_rate: str) -> datetime:
    '''Construct date object from the string representation of the date/reporting rate'''
    if reporting_rate == WEEKLY_RATE:
        year, week = date_str.split('W')
        return Week(int(year), int(week)).monday()
    if reporting_rate == QUARTERLY_RATE:
        year, quarter_number = date_str.split('Q')
        return datetime(int(year), int(quarter_number) * 3 - 2, 1)
    if reporting_rate == SIX_MONTHLY_RATE:
        year, six_month_number = date_str.split('S')
        return datetime(int(year), int(six_month_number) * 6 - 5, 1)
    if reporting_rate == YEARLY_RATE:
        return datetime.strptime(date_str, YEARLY_DATE_FORMAT)
    if reporting_rate == MONTHLY_RATE:
        return datetime.strptime(date_str, MONTHLY_DATE_FORMAT)
    if reporting_rate == DAILY_RATE:
        return datetime.strptime(date_str, DAILY_DATE_FORMAT)


class DHIS2Periods:
    '''
    Period builder class that can create list of all reporting-rate dates for given interval'''

    def __init__(
        self,
        start_date: datetime,
        end_date: datetime,
        daily_range: List[datetime] = None,
        weekly_range: List[datetime] = None,
        monthly_range: List[datetime] = None,
        quarterly_range: List[datetime] = None,
        six_monthly_range: List[datetime] = None,
        yearly_range: List[datetime] = None,
    ):
        self.start_date = start_date
        self.end_date = end_date
        self.reverse = defaultdict(dict)
        self.Daily = self.build_daily_dates_list(date_range=daily_range)
        self.Weekly = self.build_weekly_dates_list(date_range=weekly_range)
        self.Monthly = self.build_monthly_dates_list(date_range=monthly_range)
        self.Quarterly = self.build_quarterly_list(date_range=quarterly_range)
        self.SixMonthly = self.build_six_monthly_dates_list(
            date_range=six_monthly_range
        )
        self.Yearly = self.build_yearly_dates_list(date_range=yearly_range)

    def __getitem__(self, name):
        return getattr(self, name)

    def build_daily_dates_list(self, date_range: List[datetime] = None) -> List[str]:
        output = []
        start_date, end_date = self.start_date, self.end_date
        if date_range:
            start_date, end_date = date_range
        delta = end_date - start_date

        for day in range(delta.days + 1):
            current_day = start_date + timedelta(day)
            self.reverse[DAILY_RATE][
                current_day.strftime(DAILY_DATE_FORMAT)
            ] = current_day.strftime(FULL_DATE_FORMAT)
            output.append(current_day.strftime(DAILY_DATE_FORMAT))
        return output

    def build_weekly_dates_list(self, date_range: List[datetime] = None) -> List[str]:
        week_interval = relativedelta(weeks=1)
        output = []
        start_date, end_date = self.start_date, self.end_date
        if date_range:
            start_date, end_date = date_range
        current_date = start_date
        while current_date <= end_date:
            iso_date = current_date.isocalendar()
            period = f'{iso_date[0]}W{iso_date[1]}'
            self.reverse[WEEKLY_RATE][period] = current_date.strftime(FULL_DATE_FORMAT)
            output.append(period)
            current_date = current_date + week_interval
        return output

    def build_monthly_dates_list(self, date_range: List[datetime] = None) -> List[str]:
        # Create a list of dates in dateformat starting at self.START_DATE until now.
        start_date, end_date = self.start_date, self.end_date
        if date_range:
            start_date, end_date = date_range
        output = [start_date.strftime(MONTHLY_DATE_FORMAT)]

        self.reverse[MONTHLY_RATE][output[0]] = start_date.strftime(FULL_DATE_FORMAT)
        month_diff = (
            end_date.month - start_date.month + (end_date.year - start_date.year) * 12
        )
        year = start_date.year
        month = start_date.month
        for _ in range(1, month_diff + 1):
            month += 1
            if month > 12:
                year += 1
                month = 1
            date = datetime(year, month, 1)
            period = date.strftime(MONTHLY_DATE_FORMAT)
            r = []
            for day in range(1, calendar.monthrange(year, month)[1] + 1):
                d = datetime(year, month, day)
                r.append(d.strftime(FULL_DATE_FORMAT))
            self.reverse[MONTHLY_RATE][period] = r
            output.append(period)
        return output

    def build_quarterly_list(self, date_range: List[datetime] = None) -> List[str]:
        quarter_interval = relativedelta(months=3)
        output = []
        start_date, end_date = self.start_date, self.end_date
        if date_range:
            start_date, end_date = date_range
        current_date = start_date
        while current_date <= end_date:
            quarter_number = (current_date.month - 1) // 3 + 1
            period = f'{current_date.year}Q{quarter_number}'
            output.append(period)
            r = []
            for month in range(0, 3):
                # HACK(moriah): some data doesnt come in at the start of the quarter
                d = current_date + relativedelta(months=month)
                r.append(d.strftime(FULL_DATE_FORMAT))
            self.reverse[QUARTERLY_RATE][period] = r
            current_date = current_date + quarter_interval
        return output

    def build_six_monthly_dates_list(
        self, date_range: List[datetime] = None
    ) -> List[str]:
        output = []
        start_date, end_date = self.start_date, self.end_date
        if date_range:
            start_date, end_date = date_range
        six_month_interval = relativedelta(months=6)
        current_date = start_date
        while current_date < end_date:
            six_month_number = (current_date.month - 1) // 6 + 1
            period = f'{current_date.year}S{six_month_number}'
            output.append(period)
            self.reverse[SIX_MONTHLY_RATE][period] = current_date.strftime(
                FULL_DATE_FORMAT
            )
            current_date = current_date + six_month_interval
        return output

    def build_yearly_dates_list(self, date_range: List[datetime] = None) -> List[str]:
        year_interval = relativedelta(years=1)
        start_date, end_date = self.start_date, self.end_date
        if date_range:
            start_date, end_date = date_range
        current_date = start_date
        output = []
        while current_date < end_date:
            period = str(current_date.year)
            r = []
            for month in range(0, 12):
                m = current_date + relativedelta(months=month)
                r.append(m.strftime(FULL_DATE_FORMAT))
            self.reverse[YEARLY_RATE][period] = r
            output.append(period)
            current_date = current_date + year_interval
        return output
