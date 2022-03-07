// @flow
import { toGregorian, toEthiopian } from 'ethiopian-date';

import CalendarSettings from 'models/config/CalendarSettings';
import LRUCache from 'lib/LRUCache';
import Moment from 'models/core/wip/DateTime/Moment';
import {
  ETHIOPIAN_MONTHS,
  ETHIOPIAN_MONTHS_SHORT,
} from 'components/ethiopian_time';
import { calculateEpiYear } from 'models/core/wip/DateTime/formatEpiWeek';
import type DateOption from 'models/config/CalendarSettings/DateOption';

type MomentDateRange = {
  +endDate: Moment,
  +startDate: Moment,
};

const BACKEND_USING_ET_DATES = window.__JSON_FROM_BACKEND.enableEtDateSelection;

export const DATE_FORMAT = 'YYYY-MM-DD';

export const DAY_GRANULARITY = 'day';
export const WEEK_GRANULARITY = 'week';
export const MONTH_GRANULARITY = 'month';
export const QUARTER_GRANULARITY = 'quarter';
export const YEAR_GRANULARITY = 'year';

const [
  GRANULARITY_SETTINGS_MAP,
  FISCAL_START_MONTH,
  FISCAL_DATE_USES_CALENDAR_YEAR,
]: [Map<string, DateOption>, number, boolean] = (() => {
  const granularitySettingsMap = new Map();
  if (!window.__JSON_FROM_BACKEND.calendarSettings) {
    return [granularitySettingsMap, 1, false];
  }

  const calendarSettings = CalendarSettings.current();
  calendarSettings
    .granularitySettings()
    .granularities()
    .forEach(granularity => {
      granularitySettingsMap.set(granularity.id(), granularity);
    });
  return [
    granularitySettingsMap,
    calendarSettings.fiscalStartMonth(),
    calendarSettings.fiscalDateUsesCalendarYear(),
  ];
})();

// List of granularities that have special handling in ET.
const ET_EXCLUDE_DAY = [
  MONTH_GRANULARITY,
  QUARTER_GRANULARITY,
  YEAR_GRANULARITY,
  'month_of_year',
  'quarter_of_year',
];

const ET_EXCLUDE_YEAR = [
  'day_of_year',
  'week_of_year',
  'month_of_year',
  'quarter_of_year',
];

function isFiscalGranularity(granularityId: string): boolean {
  return granularityId.startsWith('fiscal');
}

export function getDefaultGregorianDateRangeMoment(): MomentDateRange {
  // Default: past 2 years.
  return {
    startDate: Moment.create().subtract(2, 'year'),
    endDate: Moment.create(),
  };
}

export const ET_DEFAULT_DATES_OBJ = {
  start: {
    year: 2009,
    month: 10,
  },
  end: {
    year: 2010,
    month: 9,
  },
};

export function getCurrentEthiopianYear(): number {
  const now = Moment.create();
  return toEthiopian(now.year(), now.month() + 1, now.date())[0];
}

export function toGregorianWithZeroIndexedMonth(
  year: number,
  month: number,
  day: number,
): [number, number, number] {
  // Helper function for ET dates.
  // toGregorian uses 1-indexed months.  This is extremely confusing if it's
  // used directly in the code because months are 0-indexed in Javascript and
  // in our component's state representation.
  const [gregYear, gregMonth, gregDay] = toGregorian(year, month + 1, day);
  return [gregYear, gregMonth - 1, gregDay];
}

export function toGregorianStartDate(
  dateObj: $PropertyType<typeof ET_DEFAULT_DATES_OBJ, 'start'>,
): [number, number, number] {
  // Helper function for ET dates.
  // Start from beginning of this month.
  return toGregorianWithZeroIndexedMonth(dateObj.year, dateObj.month, 1);
}

export function toGregorianEndDate(
  dateObj: $PropertyType<typeof ET_DEFAULT_DATES_OBJ, 'end'>,
): [number, number, number] {
  // Helper function for ET dates.
  // End at beginning of NEXT month.
  const newMonth = dateObj.month + 1;
  if (newMonth > ETHIOPIAN_MONTHS.length - 1) {
    // Edge case: rolling over to next year.
    return toGregorianWithZeroIndexedMonth(dateObj.year + 1, 0, 1);
  }
  return toGregorianWithZeroIndexedMonth(dateObj.year, newMonth, 1);
}

export function getDefaultEtDateRangeMoment(): MomentDateRange {
  return {
    startDate: Moment.create(toGregorianStartDate(ET_DEFAULT_DATES_OBJ.start)),
    endDate: Moment.create(toGregorianEndDate(ET_DEFAULT_DATES_OBJ.end)),
  };
}

export function getDefaultDateRange(): { endDate: string, startDate: string } {
  // Returns {startDate, endDate} in YYYY-MM-DD format.
  const momentRanges = BACKEND_USING_ET_DATES
    ? getDefaultEtDateRangeMoment()
    : getDefaultGregorianDateRangeMoment();
  return {
    startDate: momentRanges.startDate.format(DATE_FORMAT),
    endDate: momentRanges.endDate.format(DATE_FORMAT),
  };
}

export function momentToEthiopian(
  momentDate: Moment,
  mergePagumeIntoMeskerem: boolean = true,
): [number, number, number] {
  // Moment uses 0 based months, just like javascript
  // Ethiopian-date returns 1 based months
  // eslint-disable-next-line prefer-const
  let [year, month, day] = toEthiopian(
    momentDate.year(),
    momentDate.month() + 1,
    momentDate.date(),
  );

  // Most of the time, the MoH wants month 13 to be included with month 1 of the
  // next year. On the backend when grouping, we create a bucket that encludes
  // both months. However, the backend returns the first day of the month bucket
  // as the date label for the group. When we see month 13, just convert it to
  // month 1 of the next year because we know it will contain both months.
  if (mergePagumeIntoMeskerem && month === 13) {
    month = 1;
    year += 1;
  }

  return [year, month, day];
}

export function getEthiopianDateLabel(
  momentDate: Moment,
  mergePagumeIntoMeskerem: boolean = true,
  excludeDay: boolean = false,
  excludeMonth: boolean = false,
  excludeYear: boolean = false,
): string {
  const [year, month, day] = momentToEthiopian(
    momentDate,
    mergePagumeIntoMeskerem,
  );

  const dateComponents = [];
  if (!excludeDay && day !== 1) {
    dateComponents.push(day);
  }

  if (!excludeMonth) {
    dateComponents.push(ETHIOPIAN_MONTHS_SHORT[month - 1]);
  }

  if (!excludeYear) {
    dateComponents.push(year);
  }

  return dateComponents.join(' ');
}

function getDateFormat(
  granularity: string,
  useGraphDateFormat: boolean,
  simplify: boolean,
): string {
  const dateOption = GRANULARITY_SETTINGS_MAP.get(granularity);
  if (dateOption === undefined) {
    return DATE_FORMAT;
  }

  if (useGraphDateFormat && simplify) {
    return dateOption.shortGraphDateFormat();
  }
  if (useGraphDateFormat) {
    return dateOption.graphDateFormat();
  }
  if (simplify) {
    return dateOption.shortDateFormat();
  }
  return dateOption.defaultDateFormat();
}

const DATE_CACHE: LRUCache<Moment> = new LRUCache();
function getMomentDate(date: string): Moment {
  let momentDate = DATE_CACHE.get(date);
  if (momentDate === undefined) {
    momentDate = Moment.utc(date);
    DATE_CACHE.set(date, momentDate);
  }
  return momentDate;
}

export function formatDate(date: string, dateFormat: string): string {
  return getMomentDate(date).format(dateFormat);
}

export function formatDateByGranularity(
  date: string,
  granularity: string,
  useGraphDateFormat: boolean,
  displayEthiopianDatesIfEt: boolean = true,
  simplify: boolean = false,
): string {
  let momentDate = getMomentDate(date);

  if (BACKEND_USING_ET_DATES && displayEthiopianDatesIfEt) {
    const excludeMonth = granularity === YEAR_GRANULARITY;

    return getEthiopianDateLabel(
      momentDate,
      true,
      ET_EXCLUDE_DAY.includes(granularity),
      excludeMonth,
      simplify || ET_EXCLUDE_YEAR.includes(granularity),
    );
  }

  // If the granularity we are formatting is a fiscal granularity, and the
  // fiscal start month is not January, update the momentDate so that when it
  // is formatted it will display the correct fiscal quarter / year.
  if (FISCAL_START_MONTH !== 1 && isFiscalGranularity(granularity)) {
    // By subtracting the fiscal start month from the date, we can still use
    // moment date formatting like normal to produce the correct display result.
    // Example:
    //   Fiscal start month = 7
    //   Date = 2018-05-01
    //   Adjusted date = 2017-11-01
    //   Formatted quarter = 'Q4 FY2017'
    // Notice that the true year (2018) and true quarter (Q2) do not match what
    // the fiscal year (2017) and fiscal quarter (Q4) should be. After
    // subtracting the offset, the adjusted date will produce the correct result
    // when formatted.
    // NOTE(stephen): If the date format includes the actual month value, it
    // will be incorrect since the adjusted month will be shown.
    const calendarYear = momentDate.year();
    momentDate = momentDate.subtract(FISCAL_START_MONTH - 1, 'month');
    if (FISCAL_DATE_USES_CALENDAR_YEAR && momentDate.year() !== calendarYear) {
      momentDate = momentDate.add(1, 'year');
    }
  }

  // If we are on the ethiopian platform but the ethiopian dates ui setting has
  // been disabled we should default to showing the full gregorian date. For
  // example, the Ethiopian month Ham 2001 does not exactly line up with any
  // Gregorian month so we instead display the date on the Gregorian calendar
  // that represents the first day of that Ethiopian month.
  // TODO(david): Disassociate the concept of Ethiopian and Gregorian month
  // so that a user can select to group by either and we don't have to do this.
  const displayGranularity = BACKEND_USING_ET_DATES
    ? DAY_GRANULARITY
    : granularity;

  const dateFormat = getDateFormat(
    displayGranularity,
    useGraphDateFormat,
    simplify,
  );

  return momentDate.format(dateFormat);
}

function datesHaveSameYear(
  momentA: Moment,
  momentB: Moment,
  displayEthiopianDatesIfEt: boolean,
  granularity: string,
): boolean {
  if (BACKEND_USING_ET_DATES && displayEthiopianDatesIfEt) {
    return momentToEthiopian(momentA)[0] === momentToEthiopian(momentB)[0];
  }

  // For fiscal granularities, we need to compare the fiscal year, not the
  // calendar year.
  if (isFiscalGranularity(granularity)) {
    const fiscalOffset = FISCAL_START_MONTH - 1;
    return (
      momentA.subtract(fiscalOffset, 'month').year() ===
      momentB.subtract(fiscalOffset, 'month').year()
    );
  }

  if (granularity === 'epi_week') {
    const dateFormat = getDateFormat(granularity, false, false);
    const epiYearA = calculateEpiYear(momentA.momentView(), dateFormat);
    const epiYearB = calculateEpiYear(momentB.momentView(), dateFormat);
    return epiYearA === epiYearB;
  }

  return momentA.year() === momentB.year();
}

export function formatDatesByGranularity(
  dates: $ReadOnlyArray<string>,
  granularity: string,
  useGraphDateFormat: boolean,
  displayEthiopianDatesIfEt: boolean = true,
  simplifyDates: boolean = false,
): Array<string> {
  return dates.map((date, index) => {
    // In time series graphs we want to simplify dates such that the year is
    // only shown if it is different from the previous date. This is to make the
    // graph less cluttered and easier to read. For example, we display:
    // Jan 2018, Feb, Mar, Apr, ..., Jan 2019
    // Instead of:
    // Jan 2018, Feb 2018, Mar 2018, Apr 2018 ...
    const simplify =
      simplifyDates &&
      index !== 0 &&
      datesHaveSameYear(
        getMomentDate(date),
        getMomentDate(dates[index - 1]),
        displayEthiopianDatesIfEt,
        granularity,
      );

    return formatDateByGranularity(
      date,
      granularity,
      useGraphDateFormat,
      displayEthiopianDatesIfEt,
      simplify,
    );
  });
}
