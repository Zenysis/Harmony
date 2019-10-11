// @noflow
import { toGregorian, toEthiopian } from 'ethiopian-date';

import LRUCache from 'lib/LRUCache';
import Moment from 'models/core/wip/DateTime/Moment';
import {
  ETHIOPIAN_MONTHS,
  ETHIOPIAN_MONTHS_SHORT,
} from 'components/ethiopian_time';
import { DISPLAY_DATE_FORMAT as GRAPH_DATE_FORMAT } from 'components/QueryResult/graphUtil';

const BACKEND_USING_ET_DATES = window.__JSON_FROM_BACKEND.enableEtDateSelection;
const FISCAL_START_MONTH = window.__JSON_FROM_BACKEND.fiscalStartMonth;

export const DATE_FORMAT = 'YYYY-MM-DD';

export const DAY_GRANULARITY = 'day';
export const WEEK_GRANULARITY = 'week';
export const MONTH_GRANULARITY = 'month';
export const QUARTER_GRANULARITY = 'quarter';
export const YEAR_GRANULARITY = 'year';
const FISCAL_QUARTER_GRANULARITY = 'fiscal_quarter';
const FISCAL_YEAR_GRANULARITY = 'fiscal_year';

const DATE_FORMAT_MAP = {
  default: {
    [DAY_GRANULARITY]: DATE_FORMAT,
    [WEEK_GRANULARITY]: DATE_FORMAT,
    [MONTH_GRANULARITY]: 'MMM YYYY',
    [QUARTER_GRANULARITY]: '[Q]Q YYYY',
    [YEAR_GRANULARITY]: 'YYYY',
    [FISCAL_QUARTER_GRANULARITY]: '[Q]Q [FY]YYYY',
    [FISCAL_YEAR_GRANULARITY]: '[FY]YYYY',
    day_of_year: 'MMM D',
    week_of_year: 'MMM D',
    month_of_year: 'MMM',
    quarter_of_year: '[Q]Q',
  },
  simplified: {
    [DAY_GRANULARITY]: 'MM-DD',
    [WEEK_GRANULARITY]: 'MM-DD',
    [MONTH_GRANULARITY]: 'MMM',
    [QUARTER_GRANULARITY]: '[Q]Q',
    [YEAR_GRANULARITY]: 'YYYY',
    [FISCAL_QUARTER_GRANULARITY]: '[Q]Q',
    [FISCAL_YEAR_GRANULARITY]: '[FY]YYYY',
    day_of_year: 'MMM D',
    week_of_year: 'MMM D',
    month_of_year: 'MMM',
    quarter_of_year: '[Q]Q',
  },
  graph: {
    [DAY_GRANULARITY]: GRAPH_DATE_FORMAT,
    [WEEK_GRANULARITY]: GRAPH_DATE_FORMAT,
    [MONTH_GRANULARITY]: 'MMM YYYY',
    [QUARTER_GRANULARITY]: '[Q]Q YYYY',
    [YEAR_GRANULARITY]: 'YYYY',
    [FISCAL_QUARTER_GRANULARITY]: '[Q]Q [FY]YYYY',
    [FISCAL_YEAR_GRANULARITY]: '[FY]YYYY',
    day_of_year: 'D MMM',
    week_of_year: 'D MMM',
    month_of_year: 'MMM',
    quarter_of_year: '[Q]Q',
  },
  graphSimplified: {
    [DAY_GRANULARITY]: 'D MMM',
    [WEEK_GRANULARITY]: 'D MMM',
    [MONTH_GRANULARITY]: 'MMM',
    [QUARTER_GRANULARITY]: '[Q]Q',
    [YEAR_GRANULARITY]: 'YYYY',
    [FISCAL_QUARTER_GRANULARITY]: '[Q]Q',
    [FISCAL_YEAR_GRANULARITY]: '[FY]YYYY',
    day_of_year: 'D MMM',
    week_of_year: 'D MMM',
    month_of_year: 'MMM',
    quarter_of_year: '[Q]Q',
  },
};

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

export function getDefaultGregorianDateRangeMoment() {
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

export function getCurrentEthiopianYear() {
  const now = Moment.create();
  return toEthiopian(now.year(), now.month() + 1, now.date())[0];
}

export function toGregorianWithZeroIndexedMonth(year, month, day) {
  // Helper function for ET dates.
  // toGregorian uses 1-indexed months.  This is extremely confusing if it's
  // used directly in the code because months are 0-indexed in Javascript and
  // in our component's state representation.
  const [gregYear, gregMonth, gregDay] = toGregorian(year, month + 1, day);
  return [gregYear, gregMonth - 1, gregDay];
}

export function toGregorianStartDate(dateObj) {
  // Helper function for ET dates.
  // Start from beginning of this month.
  return toGregorianWithZeroIndexedMonth(dateObj.year, dateObj.month, 1);
}

export function toGregorianEndDate(dateObj) {
  // Helper function for ET dates.
  // End at beginning of NEXT month.
  const newMonth = dateObj.month + 1;
  if (newMonth > ETHIOPIAN_MONTHS.length - 1) {
    // Edge case: rolling over to next year.
    return toGregorianWithZeroIndexedMonth(dateObj.year + 1, 0, 1);
  }
  return toGregorianWithZeroIndexedMonth(dateObj.year, newMonth, 1);
}

export function getDefaultEtDateRangeMoment() {
  return {
    startDate: Moment.create(toGregorianStartDate(ET_DEFAULT_DATES_OBJ.start)),
    endDate: Moment.create(toGregorianEndDate(ET_DEFAULT_DATES_OBJ.end)),
  };
}

export function getDefaultDateRange() {
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
  momentDate,
  mergePagumeIntoMeskerem = true,
  excludeDay = false,
  excludeMonth = false,
  excludeYear = false,
) {
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

function getDateFormat(granularity, useGraphDateFormat, simplify) {
  if (useGraphDateFormat && simplify) {
    return DATE_FORMAT_MAP.graphSimplified[granularity];
  }
  if (useGraphDateFormat) {
    return DATE_FORMAT_MAP.graph[granularity];
  }
  if (simplify) {
    return DATE_FORMAT_MAP.simplified[granularity];
  }
  return DATE_FORMAT_MAP.default[granularity];
}

const DATE_CACHE: LRUCache<typeof Moment> = new LRUCache();
function getMomentDate(date: string) {
  let momentDate = DATE_CACHE.get(date);
  if (momentDate === undefined) {
    momentDate = Moment.utc(date);
    DATE_CACHE.set(date, momentDate);
  }
  return momentDate;
}

export function formatDateByGranularity(
  date: string,
  granularity,
  useGraphDateFormat: boolean,
  displayEthiopianDatesIfEt: boolean = true,
  simplify = false,
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
  if (
    FISCAL_START_MONTH !== 1 &&
    (granularity === FISCAL_QUARTER_GRANULARITY ||
      granularity === FISCAL_YEAR_GRANULARITY)
  ) {
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
    momentDate = momentDate.subtract(FISCAL_START_MONTH - 1, 'month');
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
  if (
    granularity === FISCAL_QUARTER_GRANULARITY ||
    granularity === FISCAL_YEAR_GRANULARITY
  ) {
    const fiscalOffset = FISCAL_START_MONTH - 1;
    return (
      momentA.subtract(fiscalOffset, 'month').year() ===
      momentB.subtract(fiscalOffset, 'month').year()
    );
  }

  return momentA.year() === momentB.year();
}

export function formatDatesByGranularity(
  dates,
  granularity,
  useGraphDateFormat,
  displayEthiopianDatesIfEt = true,
  simplifyDates = false,
) {
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
        getMomentDate(date.toString()),
        getMomentDate(dates[index - 1].toString()),
        displayEthiopianDatesIfEt,
        granularity,
      );

    return formatDateByGranularity(
      date.toString(),
      granularity,
      useGraphDateFormat,
      displayEthiopianDatesIfEt,
      simplify,
    );
  });
}
