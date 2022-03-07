// @flow
import moment from 'moment';
import { toEthiopian, toGregorian } from 'ethiopian-date';

import { ETHIOPIAN_MONTHS } from 'components/ethiopian_time';

/**
 * Convert a Moment instance (that holds a Gregorian date) to a
 * { day, month, year } object representing the Ethiopian date.
 */
export function dateToEthiopian(
  date: moment$Moment,
): { year: number, month: number, day: number } {
  const [year, month, day] = toEthiopian(
    date.year(),
    date.month() + 1,
    date.date(),
  );

  return { year, month, day };
}

/**
 * Convert a Moment instance (that holds a Gregorian date) to a
 * displayable string for the Ethiopian date.
 */
export function dateToEthiopianDateString(date: moment$Moment): string {
  const { day, month, year } = dateToEthiopian(date);
  return `${day} ${ETHIOPIAN_MONTHS[month - 1]} ${year}`;
}

/**
 * Convert an ethiopian date represented as a { month, year } object to a
 * Moment instance that holds a Gregorian date.
 */
export function ethiopianToDate(dateTuple: {
  year: number,
  month: number,
}): moment$Moment {
  const { year, month } = dateTuple;

  // Set the date to day 1 of the month since we only allow month selection.
  const [gYear, gMonth, gDay] = toGregorian([year, month, 1]);
  return moment.utc([gYear, gMonth - 1, gDay]);
}
