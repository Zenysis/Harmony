// @flow
export type CalendarTypeConfig =
  | {
      type: 'GREGORIAN',
      displayName?: ?string,
    }
  | {
      type: 'ETHIOPIAN',
      minimumEthiopianYear: number,
      displayName?: ?string,
    };

export type CalendarType = $PropertyType<CalendarTypeConfig, 'type'>;

export type DateUnit =
  | 'DAY'
  | 'WEEK'
  | 'MONTH'
  | 'QUARTER'
  | 'YEAR'
  | 'FISCAL_QUARTER'
  | 'FISCAL_HALF'
  | 'FISCAL_YEAR';

export type DateGranularityConfig = {
  dateUnit: DateUnit,
  displayName?: ?string,
};

export type ThisDateConfig = {
  +modifier: 'THIS',
  +dateUnit: DateUnit,

  // the display name is optional in all date configurations, and it is only
  // used so that the user can customize how the date config should be labeled
  // if it is listed as a Quick Option.
  +displayName?: ?string,
};

export type LastDateConfig = {
  +modifier: 'LAST',
  +dateUnit: DateUnit,
  +numIntervals: number,
  +includeCurrentInterval: boolean,
  +displayName?: ?string,
};

export type AllTimeConfig = {
  +modifier: 'ALL_TIME',
  +calendarType?: CalendarType,
  +displayName?: ?string,
};

/**
 * This config goes from the start of the current year until the current date.
 * E.g. if today is January 22, 2021, then YEAR_TO_DATE will result in a date
 * range of Jan 1 2021 to Jan 22 2021.
 * If `usePreviousYear` flag is true, and `numYearsLookback` is set, then
 * we shift the date range back to a previous year. How far back we go depends
 * on `numyearsLookback`. E.g. for numYearsLookback == 2, (and if today is
 * currently Jan 22 2021), then this would go from Jan 1 2019 to Jan 22 2019.
 */
export type YearToDateConfig = {
  +modifier: 'YEAR_TO_DATE',
  +usePreviousYear: boolean,
  +numYearsLookback: number,
  +calendarType?: CalendarType,
  +displayName?: ?string,
};

export type DateRange = {
  +from: moment$Moment | void,
  +to: moment$Moment | void,
};

export type DateConfiguration =
  | ThisDateConfig
  | LastDateConfig
  | AllTimeConfig
  | YearToDateConfig
  | {
      +modifier: 'BETWEEN',
      +range: DateRange,
      +calendarType?: CalendarType,
      +displayName?: ?string,
    }
  | {
      +modifier: 'SINCE',
      +date: moment$Moment | void,
      +calendarType?: CalendarType,
      +displayName?: ?string,
    };

export type QuickOptionChoice = DateConfiguration | 'CUSTOM';

export type DateModifier = $PropertyType<DateConfiguration, 'modifier'>;

export const MODIFIERS: $ReadOnlyArray<DateModifier> = [
  'THIS',
  'LAST',
  'BETWEEN',
  'SINCE',
];

export const DEFAULT_CALENDAR_TYPES: $ReadOnlyArray<CalendarTypeConfig> = [
  { type: 'GREGORIAN' },
];

/**
 * Check if a DateConfiguration is THIS or LAST (i.e. uses DateUnit selections,
 * such as 'week', 'month', 'quarter', etc.)
 */
export function hasDateUnitSelections(
  dateConfig: DateConfiguration,
): boolean %checks {
  return dateConfig.modifier === 'THIS' || dateConfig.modifier === 'LAST';
}

function _areDatesEqual(
  date1: moment$Moment | void,
  date2: moment$Moment | void,
): boolean {
  if (date1 && date2) {
    return date1.isSame(date2);
  }
  return date1 === date2;
}

/**
 * Check if two SINCE date configurations are equal.
 * This ignores their display names, because those are not necessary in
 * determining if date configurations are the same.
 *
 * We need to pass a `defaultCalendarType` to use in case either
 * DateConfiguration does not have a calendarType set.
 */
export function areSinceDateConfigurationsEqual(
  dateConfig1: DateConfiguration,
  dateConfig2: DateConfiguration,
  defaultCalendarType: CalendarType,
): boolean {
  if (dateConfig1.modifier === 'SINCE' && dateConfig2.modifier === 'SINCE') {
    const d1 = dateConfig1.date;
    const d2 = dateConfig2.date;
    const calendar1 = dateConfig1.calendarType || defaultCalendarType;
    const calendar2 = dateConfig2.calendarType || defaultCalendarType;
    const calendarTypesEqual = calendar1 === calendar2;
    return _areDatesEqual(d1, d2) && calendarTypesEqual;
  }
  return false;
}

/**
 * Check if two BETWEEN date configurations are equal.
 * This ignores their display names, because those are not necessary in
 * determining if date configurations are the same.
 *
 * We need to pass a `defaultCalendarType` to use in case either
 * DateConfiguration does not have a calendarType set.
 */
export function areBetweenDateConfigurationsEqual(
  dateConfig1: DateConfiguration,
  dateConfig2: DateConfiguration,
  defaultCalendarType: CalendarType,
): boolean {
  if (
    dateConfig1.modifier === 'BETWEEN' &&
    dateConfig2.modifier === 'BETWEEN'
  ) {
    const fromDate1 = dateConfig1.range.from;
    const fromDate2 = dateConfig2.range.from;
    const toDate1 = dateConfig1.range.to;
    const toDate2 = dateConfig2.range.to;
    const calendar1 = dateConfig1.calendarType || defaultCalendarType;
    const calendar2 = dateConfig2.calendarType || defaultCalendarType;
    const calendarTypesEqual = calendar1 === calendar2;
    return (
      _areDatesEqual(fromDate1, fromDate2) &&
      _areDatesEqual(toDate1, toDate2) &&
      calendarTypesEqual
    );
  }
  return false;
}

/**
 * Check if two YEAR_TO_DATE date configurations are equal.
 * This ignores their display names, because those are not necessary in
 * determining if date configurations are the same.
 *
 * We need to pass a `defaultCalendarType` to use in case either
 * DateConfiguration does not have a calendarType set.
 */
export function areYearToDateConfigurationsEqual(
  dateConfig1: DateConfiguration,
  dateConfig2: DateConfiguration,
  defaultCalendarType: CalendarType,
): boolean {
  if (
    dateConfig1.modifier === 'YEAR_TO_DATE' &&
    dateConfig2.modifier === 'YEAR_TO_DATE'
  ) {
    const calendar1 = dateConfig1.calendarType || defaultCalendarType;
    const calendar2 = dateConfig2.calendarType || defaultCalendarType;
    const calendarTypesEqual = calendar1 === calendar2;

    // if `usePreviousYear` is true, then we also need to make sure
    // that the `numYearsLookback` values are equal
    if (dateConfig1.usePreviousYear && dateConfig2.usePreviousYear) {
      return (
        calendarTypesEqual &&
        dateConfig1.numYearsLookback === dateConfig2.numYearsLookback
      );
    }

    // if `usePreviousYear` is false, then we don't care about checking
    // the `numYearsLookback` value
    if (!dateConfig1.usePreviousYear && !dateConfig2.usePreviousYear) {
      return calendarTypesEqual;
    }
  }
  return false;
}
