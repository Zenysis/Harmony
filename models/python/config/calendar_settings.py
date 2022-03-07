from enum import Enum

import related

from models.python.config.datepicker_settings import DatePickerSettings


class GranularityType(Enum):
    '''The queryable granularities available.'''

    DAY = 'day'
    WEEK = 'week'
    MONTH = 'month'
    QUARTER = 'quarter'
    YEAR = 'year'
    EPI_WEEK = 'epi_week'
    FISCAL_QUARTER = 'fiscal_quarter'
    FISCAL_HALF = 'fiscal_half'
    FISCAL_YEAR = 'fiscal_year'
    DAY_OF_YEAR = 'day_of_year'
    WEEK_OF_YEAR = 'week_of_year'
    MONTH_OF_YEAR = 'month_of_year'
    QUARTER_OF_YEAR = 'quarter_of_year'
    EPI_WEEK_OF_YEAR = 'epi_week_of_year'


GRANULARITY_TYPE_IDS = [g.value for g in GranularityType]

DEFAULT_ENABLED_GRANULARITIES = [
    GranularityType.MONTH,
    GranularityType.QUARTER,
    GranularityType.YEAR,
    GranularityType.MONTH_OF_YEAR,
    GranularityType.QUARTER_OF_YEAR,
]


@related.mutable(strict=True)
class DateOption:
    id = related.ChildField(GranularityType)
    name = related.StringField()
    default_date_format = related.StringField(key='defaultDateFormat')
    short_date_format = related.StringField(key='shortDateFormat', required=False)
    graph_date_format = related.StringField(key='graphDateFormat', required=False)
    short_graph_date_format = related.StringField(
        key='shortGraphDateFormat', required=False
    )
    enabled = related.BooleanField(True)


@related.mutable(strict=True)
class GranularitySettings:
    '''Mapping from granularity ID to the settings for that granularity.'''

    # mypy-related-issue - throughout this class
    day = related.ChildField(
        DateOption,
        DateOption(  # type: ignore[call-arg]
            GranularityType.DAY, 'Day', 'YYYY-MM-DD', 'MM-DD', 'D MMM YYYY', 'D MMM'
        ),
    )
    week = related.ChildField(
        DateOption, DateOption(GranularityType.WEEK, 'Week', 'D MMM YYYY', 'D MMM')  # type: ignore[call-arg]
    )
    month = related.ChildField(
        DateOption, DateOption(GranularityType.MONTH, 'Month', 'MMM YYYY', 'MMM')  # type: ignore[call-arg]
    )
    quarter = related.ChildField(
        DateOption, DateOption(GranularityType.QUARTER, 'Quarter', '[Q]Q YYYY', '[Q]Q')  # type: ignore[call-arg]
    )
    year = related.ChildField(
        DateOption, DateOption(GranularityType.YEAR, 'Year', 'YYYY')  # type: ignore[call-arg]
    )
    # NOTE(stephen): Using our custom epi-week support that is available on the
    # frontend. The default format is WHO epi week format.
    epi_week = related.ChildField(
        DateOption,
        DateOption(GranularityType.EPI_WEEK, 'Epi Week', '[W]rr YYYY', '[W]rr'),  # type: ignore[call-arg]
        key='epiWeek',
    )
    fiscal_quarter = related.ChildField(
        DateOption,
        DateOption(  # type: ignore[call-arg]
            GranularityType.FISCAL_QUARTER, 'Fiscal Quarter', '[Q]Q [FY]YYYY', '[Q]Q'
        ),
        key='fiscalQuarter',
    )
    fiscal_half = related.ChildField(
        DateOption,
        DateOption(  # type: ignore[call-arg]
            GranularityType.FISCAL_HALF, 'Fiscal Half', '[FY]YYYY [H]vv', '[H]vv'
        ),
        key='fiscalHalf',
    )
    fiscal_year = related.ChildField(
        DateOption,
        DateOption(GranularityType.FISCAL_YEAR, 'Fiscal Year', '[FY]YYYY'),  # type: ignore[call-arg]
        key='fiscalYear',
    )
    day_of_year = related.ChildField(
        DateOption,
        DateOption(  # type: ignore[call-arg]
            GranularityType.DAY_OF_YEAR,
            'Day of Year',
            'MMM D',
            graph_date_format='D MMM',
        ),
        key='dayOfYear',
    )
    week_of_year = related.ChildField(
        DateOption,
        DateOption(  # type: ignore[call-arg]
            GranularityType.WEEK_OF_YEAR,
            'Week of Year',
            'MMM D',
            graph_date_format='D MMM',
        ),
        key='weekOfYear',
    )
    month_of_year = related.ChildField(
        DateOption,
        DateOption(GranularityType.MONTH_OF_YEAR, 'Month of Year', 'MMM'),  # type: ignore[call-arg]
        key='monthOfYear',
    )
    quarter_of_year = related.ChildField(
        DateOption,
        DateOption(GranularityType.QUARTER_OF_YEAR, 'Quarter of Year', '[Q]Q'),  # type: ignore[call-arg]
        key='quarterOfYear',
    )
    # NOTE(stephen): Using our custom epi-week support that is available on the
    # frontend. The default format is WHO epi week format.
    epi_week_of_year = related.ChildField(
        DateOption,
        DateOption(GranularityType.EPI_WEEK_OF_YEAR, 'Epi Week of Year', '[W]rr'),  # type: ignore[call-arg]
        key='epiWeekOfYear',
    )

    def values(self):
        for granularity_type in GranularityType:
            yield getattr(self, granularity_type.value)

    def get_settings(self, granularity_id: str) -> DateOption:
        '''Retrieve the settings for the specified granularity ID. Granularity IDs are
        kept in sync between the GranularitySettings and the possible granularity
        groupings a user can select on the frontend.
        '''
        if granularity_id not in GRANULARITY_TYPE_IDS:
            raise ValueError(f'Unknown granularity ID supplied: {granularity_id}')
        return getattr(self, granularity_id)


@related.mutable(strict=True)
class CalendarSettings:
    '''The calendar settings that determine the display format and queryable
    granularities for a deployment.
    '''

    granularity_settings = related.ChildField(
        GranularitySettings, key='granularitySettings'
    )

    datepicker_settings = related.ChildField(
        DatePickerSettings, key='datePickerSettings'
    )

    fiscal_start_month = related.IntegerField(1, key='fiscalStartMonth')

    # This setting will cause the date format of fiscal dates to preserve the calendar
    # year that the date falls in instead of showing the fiscal year that they truly
    # reside in.
    # NOTE(stephen): This setting is of particularly limited utility, but it is a
    # necessary short-term fix for the way NACOSA/BeyondZero/Afsa need to display dates.
    fiscal_date_uses_calendar_year = related.BooleanField(
        False, key='fiscalDateUsesCalendarYear'
    )

    @staticmethod
    def create_default(
        enabled_granularities=None,
        fiscal_start_month=1,
        enable_all_granularities=False,
        enable_ethiopian_calendar=False,
        minimum_ethiopian_year=2000,
    ):
        enabled_granularities = enabled_granularities or DEFAULT_ENABLED_GRANULARITIES
        granularity_settings = GranularitySettings()
        for option in granularity_settings.values():
            option.enabled = (
                option.id in enabled_granularities or enable_all_granularities
            )

        # Only enable fiscal calendar options if the fiscal year does not start in
        # January.
        # NOTE(stephen): Intentionally not enabling fiscal half year, unlike the others,
        # since it does not have broad appeal.
        enable_fiscal_calendar = fiscal_start_month != 1
        granularity_settings.fiscal_quarter.enabled = enable_fiscal_calendar
        granularity_settings.fiscal_year.enabled = enable_fiscal_calendar
        granularity_settings.fiscal_half.enabled = False

        return CalendarSettings(
            granularity_settings=granularity_settings,
            fiscal_start_month=fiscal_start_month,
            datepicker_settings=DatePickerSettings.create_default(
                enable_fiscal_calendar,
                enable_ethiopian_calendar,
                minimum_ethiopian_year,
            ),
        )
