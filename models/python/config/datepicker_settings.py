from enum import Enum

import related


class CalendarType(Enum):
    GREGORIAN = "GREGORIAN"
    ETHIOPIAN = "ETHIOPIAN"


class CalendarTypeConfig:
    calendar_type = related.ChildField(CalendarType, key="type")
    display_name = related.StringField(required=False, key="displayName")


@related.mutable(strict=True)
class GregorianCalendarConfig(CalendarTypeConfig):
    calendar_type = related.ChildField(CalendarType, CalendarType.GREGORIAN, key="type")


@related.mutable(strict=True)
class EthiopianCalendarConfig(CalendarTypeConfig):
    minimum_ethiopian_year = related.IntegerField(
        required=False, key="minimumEthiopianYear"
    )
    calendar_type = related.ChildField(CalendarType, CalendarType.ETHIOPIAN, key="type")


# NOTE(pablo): this class intentionally doesn't use the GranularityType from
# calendar_settings because that enum allows for granularities that are not
# compatible with a relative date selection (e.g. 'week_of_year')
# NOTE(pablo): for easy compatibility with the enums on the frontend, the
# values are all upper-cased
class DateUnitType(Enum):
    DAY = "DAY"
    WEEK = "WEEK"
    MONTH = "MONTH"
    QUARTER = "QUARTER"
    YEAR = "YEAR"
    FISCAL_QUARTER = "FISCAL_QUARTER"
    FISCAL_HALF = "FISCAL_HALF"
    FISCAL_YEAR = "FISCAL_YEAR"


class DateModifierType(Enum):
    THIS = "THIS"
    LAST = "LAST"
    ALL_TIME = "ALL_TIME"
    YEAR_TO_DATE = "YEAR_TO_DATE"


@related.mutable(strict=True)
class DateGranularityConfig:
    """Couples a date unit to its display name. Some deployments name some date
    units differently. For example, for ZA, Fiscal Quarters are referred to as
    Global Fund Quarters
    """

    date_unit = related.ChildField(DateUnitType, key="dateUnit")
    display_name = related.StringField(required=False, key="displayName")


@related.mutable(strict=True)
class RelativeDateConfig:
    modifier = related.ChildField(DateModifierType)


@related.mutable(strict=True)
class ThisDateConfig(RelativeDateConfig):
    date_unit = related.ChildField(DateUnitType, key="dateUnit")
    modifier = related.ChildField(DateModifierType, DateModifierType.THIS)
    display_name = related.StringField(required=False, key="displayName")


@related.mutable(strict=True)
class LastDateConfig(RelativeDateConfig):
    date_unit = related.ChildField(DateUnitType, key="dateUnit")

    # must be greater than 0
    num_intervals = related.IntegerField(key="numIntervals")
    include_current_interval = related.BooleanField(key="includeCurrentInterval")
    modifier = related.ChildField(DateModifierType, DateModifierType.LAST)
    display_name = related.StringField(required=False, key="displayName")


@related.mutable(strict=True)
class AllTimeConfig(RelativeDateConfig):
    modifier = related.ChildField(DateModifierType, DateModifierType.ALL_TIME)
    calendar_type = related.ChildField(
        CalendarType, CalendarType.GREGORIAN, key="calendarType"
    )
    display_name = related.StringField(required=False, key="displayName")


@related.mutable(strict=True)
class YearToDateConfig(RelativeDateConfig):
    use_previous_year = related.BooleanField(key="usePreviousYear")
    num_years_lookback = related.IntegerField(key="numYearsLookback")
    modifier = related.ChildField(DateModifierType, DateModifierType.YEAR_TO_DATE)
    calendar_type = related.ChildField(
        CalendarType, CalendarType.GREGORIAN, key="calendarType"
    )
    display_name = related.StringField(required=False, key="displayName")


DEFAULT_ENABLED_GRANULARITIES = [
    # mypy-related-issue
    DateGranularityConfig(DateUnitType.DAY),  # type: ignore[call-arg]
    DateGranularityConfig(DateUnitType.WEEK),  # type: ignore[call-arg]
    DateGranularityConfig(DateUnitType.MONTH),  # type: ignore[call-arg]
    DateGranularityConfig(DateUnitType.QUARTER),  # type: ignore[call-arg]
    DateGranularityConfig(DateUnitType.YEAR),  # type: ignore[call-arg]
]


DEFAULT_RELATIVE_DATES = [
    # mypy-related-issue
    ThisDateConfig(date_unit=DateUnitType.WEEK),  # type: ignore[call-arg]
    LastDateConfig(
        date_unit=DateUnitType.WEEK, num_intervals=1, include_current_interval=False
    ),  # type: ignore[call-arg]
    ThisDateConfig(date_unit=DateUnitType.MONTH),  # type: ignore[call-arg]
    LastDateConfig(
        date_unit=DateUnitType.MONTH, num_intervals=1, include_current_interval=False
    ),  # type: ignore[call-arg]
    LastDateConfig(
        date_unit=DateUnitType.QUARTER, num_intervals=1, include_current_interval=False
    ),  # type: ignore[call-arg]
    LastDateConfig(
        date_unit=DateUnitType.MONTH, num_intervals=6, include_current_interval=False
    ),  # type: ignore[call-arg]
    ThisDateConfig(date_unit=DateUnitType.YEAR),  # type: ignore[call-arg]
    LastDateConfig(
        date_unit=DateUnitType.DAY, num_intervals=365, include_current_interval=False
    ),  # type: ignore[call-arg]
    LastDateConfig(
        date_unit=DateUnitType.YEAR, num_intervals=1, include_current_interval=False
    ),  # type: ignore[call-arg]
    YearToDateConfig(use_previous_year=False, num_years_lookback=1),  # type: ignore[call-arg]
    AllTimeConfig(),
]

DEFAULT_CALENDAR_TYPES = [GregorianCalendarConfig()]


@related.mutable(strict=True)
class DatePickerSettings:
    """The date picker options to enable for a deployment. This can be
    different from the enabled granularities in CalendarSettings. For example,
    a deployment might only allow Monthly group-bys, but the Date Picker filter
    can still allow the user to set a Daily relative date (e.g. "Last 365 Days")
    """

    # the date granularities to allow
    enabled_granularities = related.SequenceField(
        DateGranularityConfig, key="enabledGranularities"
    )

    # the default preconfigured date options a user can select in the date picker
    # for a pre-configured relative date (e.g. "Last 6 Weeks")
    default_relative_dates = related.SequenceField(
        RelativeDateConfig, key="defaultRelativeDates"
    )

    enabled_calendar_types = related.SequenceField(
        CalendarTypeConfig, key="enabledCalendarTypes"
    )
    default_calendar_type = related.ChildField(CalendarType, key="defaultCalendarType")

    def rename_granularity(self, date_unit, display_name):
        """Changes the `display_name` for a granularity with a given `date_unit`

        Args:
            date_unit (str): date unit we want to rename
            display_name (str): new display name to apply to this date unit
        """
        for granularity in self.enabled_granularities:
            if granularity.date_unit.value.lower() == date_unit.lower():
                granularity.display_name = display_name
                break

    @staticmethod
    def create_default(
        enable_fiscal_calendar=False,
        enable_ethiopian_calendar=False,
        minimum_ethiopian_year=2000,
    ):
        """Create the default date picker settings from a given CalendarSettings model

        Args:
            enable_fiscal_calendar (bool): whether or not the fiscal calendar
                relative dates (e.g. FISCAL_QUARTER) should be enabled.
            enable_ethiopian_calendar (bool): whether or not to enable the
                ethiopian calendar for the date picker
        """
        enabled_granularities = DEFAULT_ENABLED_GRANULARITIES
        if enable_fiscal_calendar:
            enabled_granularities += [
                DateGranularityConfig(DateUnitType.FISCAL_QUARTER),
                DateGranularityConfig(DateUnitType.FISCAL_HALF),
                DateGranularityConfig(DateUnitType.FISCAL_YEAR),
            ]

        default_calendar_type = CalendarType.GREGORIAN
        enabled_calendar_types = DEFAULT_CALENDAR_TYPES
        if enable_ethiopian_calendar:
            default_calendar_type = CalendarType.ETHIOPIAN
            enabled_calendar_types = [
                # mypy-related-issue
                EthiopianCalendarConfig(
                    minimum_ethiopian_year=minimum_ethiopian_year
                ),  # type: ignore[call-arg]
                GregorianCalendarConfig(),
            ]

        default_relative_dates = DEFAULT_RELATIVE_DATES
        if enable_ethiopian_calendar:
            default_relative_dates = [
                date_config
                if date_config.modifier.value != "ALL_TIME"
                else AllTimeConfig(calendar_type=CalendarType.ETHIOPIAN)
                for date_config in DEFAULT_RELATIVE_DATES
            ]

        return DatePickerSettings(
            enabled_granularities=enabled_granularities,
            default_relative_dates=default_relative_dates,
            default_calendar_type=default_calendar_type,
            enabled_calendar_types=enabled_calendar_types,
        )
