// @flow
import moment from 'moment';

import CalendarSettings from 'models/config/CalendarSettings';
import DatePickerSettings from 'models/config/CalendarSettings/DatePickerSettings';
import { DATE_FORMAT, getDefaultGregorianDateRangeMoment } from 'util/dateUtil';
import { buildRelativeFiscalDates } from 'components/ui/DatePicker/computeDateRange';
import type { DateConfiguration } from 'components/ui/DatePicker/types';

const MIN_DATA_DATE = window.__JSON_FROM_BACKEND.ui.minDataDate;
const MAX_DATA_DATE = window.__JSON_FROM_BACKEND.ui.maxDataDate;

export type RelativeDateType =
  | 'CURRENT_CALENDAR_MONTH'
  | 'CURRENT_QUARTER'
  | 'CURRENT_YEAR'
  | 'FORECAST'
  | 'PREVIOUS_CALENDAR_DAY'
  | 'PREVIOUS_CALENDAR_WEEK'
  | 'PREVIOUS_CALENDAR_MONTH'
  | 'PREVIOUS_QUARTER'
  | 'PREVIOUS_CALENDAR_YEAR'
  | 'CURRENT_FISCAL_QUARTER'
  | 'CURRENT_FISCAL_YEAR'
  | 'PREVIOUS_FISCAL_QUARTER'
  | 'PREVIOUS_FISCAL_YEAR'
  | 'LAST_365_DAYS'
  | 'ALL_TIME';

export type DateType = 'CUSTOM' | 'ET_CHOOSE_MONTHS' | RelativeDateType;

export const RELATIVE_DATE_TYPE = {
  CURRENT_CALENDAR_MONTH: 'CURRENT_CALENDAR_MONTH',
  CURRENT_QUARTER: 'CURRENT_QUARTER',
  CURRENT_YEAR: 'CURRENT_YEAR',
  PREVIOUS_CALENDAR_DAY: 'PREVIOUS_CALENDAR_DAY',
  PREVIOUS_CALENDAR_WEEK: 'PREVIOUS_CALENDAR_WEEK',
  PREVIOUS_CALENDAR_MONTH: 'PREVIOUS_CALENDAR_MONTH',
  PREVIOUS_CALENDAR_YEAR: 'PREVIOUS_CALENDAR_YEAR',
  CURRENT_FISCAL_QUARTER: 'CURRENT_FISCAL_QUARTER',
  CURRENT_FISCAL_HALF: 'CURRENT_FISCAL_HALF',
  CURRENT_FISCAL_YEAR: 'CURRENT_FISCAL_YEAR',
  PREVIOUS_FISCAL_QUARTER: 'PREVIOUS_FISCAL_QUARTER',
  PREVIOUS_FISCAL_HALF: 'PREVIOUS_FISCAL_HALF',
  PREVIOUS_FISCAL_YEAR: 'PREVIOUS_FISCAL_YEAR',
  LAST_365_DAYS: 'LAST_365_DAYS',
  PREVIOUS_QUARTER: 'PREVIOUS_QUARTER',
  FORECAST: 'FORECAST',
  ALL_TIME: 'ALL_TIME',
};

export function computeRelativeDate(
  val: DateType,
): { startDate: string, endDate: string } {
  let startDate;
  let endDate;
  const fiscalStartMonth = CalendarSettings.current().fiscalStartMonth();
  switch (val) {
    case RELATIVE_DATE_TYPE.CURRENT_CALENDAR_MONTH:
      startDate = moment().startOf('month');
      endDate = moment()
        .endOf('month')
        .add(1, 'd');
      break;
    case RELATIVE_DATE_TYPE.CURRENT_QUARTER:
      startDate = moment().startOf('quarter');
      endDate = moment()
        .endOf('quarter')
        .add(1, 'd');
      break;
    case RELATIVE_DATE_TYPE.CURRENT_YEAR:
      startDate = moment().startOf('year');
      endDate = moment().startOf('day');
      break;
    case RELATIVE_DATE_TYPE.PREVIOUS_CALENDAR_DAY:
      startDate = moment()
        .startOf('day')
        .subtract(1, 'd');
      endDate = moment().startOf('day');
      break;
    case RELATIVE_DATE_TYPE.PREVIOUS_CALENDAR_WEEK:
      startDate = moment()
        .subtract(1, 'week')
        .startOf('week');
      endDate = moment()
        .subtract(1, 'week')
        .endOf('week')
        .add(1, 'd');
      break;
    case RELATIVE_DATE_TYPE.PREVIOUS_CALENDAR_MONTH:
      startDate = moment()
        .subtract(1, 'month')
        .startOf('month');
      endDate = moment()
        .subtract(1, 'month')
        .endOf('month')
        .add(1, 'd');
      break;
    case RELATIVE_DATE_TYPE.PREVIOUS_QUARTER:
      startDate = moment()
        .subtract(1, 'quarter')
        .startOf('quarter');
      endDate = moment()
        .subtract(1, 'quarter')
        .endOf('quarter')
        .add(1, 'd');
      break;
    case RELATIVE_DATE_TYPE.PREVIOUS_CALENDAR_YEAR:
      startDate = moment()
        .subtract(1, 'year')
        .startOf('year');
      endDate = moment()
        .subtract(1, 'year')
        .endOf('year')
        .add(1, 'd');
      break;
    case RELATIVE_DATE_TYPE.CURRENT_FISCAL_QUARTER:
      [startDate, endDate] = buildRelativeFiscalDates(
        'FISCAL_QUARTER',
        fiscalStartMonth,
        0,
        true,
      );
      break;
    case RELATIVE_DATE_TYPE.CURRENT_FISCAL_HALF:
      [startDate, endDate] = buildRelativeFiscalDates(
        'FISCAL_HALF',
        fiscalStartMonth,
        0,
        true,
      );
      break;
    case RELATIVE_DATE_TYPE.CURRENT_FISCAL_YEAR:
      [startDate, endDate] = buildRelativeFiscalDates(
        'FISCAL_YEAR',
        fiscalStartMonth,
        0,
        true,
      );
      break;
    case RELATIVE_DATE_TYPE.PREVIOUS_FISCAL_QUARTER:
      [startDate, endDate] = buildRelativeFiscalDates(
        'FISCAL_QUARTER',
        fiscalStartMonth,
        1,
      );
      break;
    case RELATIVE_DATE_TYPE.PREVIOUS_FISCAL_HALF:
      [startDate, endDate] = buildRelativeFiscalDates(
        'FISCAL_HALF',
        fiscalStartMonth,
        1,
      );
      break;
    case RELATIVE_DATE_TYPE.PREVIOUS_FISCAL_YEAR:
      [startDate, endDate] = buildRelativeFiscalDates(
        'FISCAL_YEAR',
        fiscalStartMonth,
        1,
      );
      break;
    case RELATIVE_DATE_TYPE.LAST_365_DAYS:
      startDate = moment().subtract(365, 'days');
      endDate = moment().add(1, 'day'); // End date is not inclusive.
      break;
    case RELATIVE_DATE_TYPE.FORECAST:
      startDate = moment(MIN_DATA_DATE);
      endDate = moment()
        .add(1, 'year')
        .add(1, 'd');
      break;
    case RELATIVE_DATE_TYPE.ALL_TIME:
      startDate = moment(MIN_DATA_DATE);
      endDate = moment(MAX_DATA_DATE).add(1, 'day');
      break;
    default: {
      const range = getDefaultGregorianDateRangeMoment();
      ({ startDate, endDate } = range);
      break;
    }
  }

  return {
    startDate: startDate.format(DATE_FORMAT),
    endDate: endDate.format(DATE_FORMAT),
  };
}

// TODO(pablo): $SQTDeprecate kill this function once the old date picker is killed off
export function relativeDateTypeToDateConfiguration(
  dateType: DateType,
): DateConfiguration {
  switch (dateType) {
    case RELATIVE_DATE_TYPE.CURRENT_CALENDAR_MONTH:
      return { modifier: 'THIS', dateUnit: 'MONTH' };
    case RELATIVE_DATE_TYPE.CURRENT_QUARTER:
      return { modifier: 'THIS', dateUnit: 'QUARTER' };
    case RELATIVE_DATE_TYPE.CURRENT_YEAR:
      return { modifier: 'THIS', dateUnit: 'YEAR' };
    case RELATIVE_DATE_TYPE.PREVIOUS_CALENDAR_DAY:
      return {
        modifier: 'LAST',
        dateUnit: 'DAY',
        numIntervals: 1,
        includeCurrentInterval: false,
      };
    case RELATIVE_DATE_TYPE.PREVIOUS_CALENDAR_WEEK:
      return {
        modifier: 'LAST',
        dateUnit: 'WEEK',
        numIntervals: 1,
        includeCurrentInterval: false,
      };
    case RELATIVE_DATE_TYPE.PREVIOUS_CALENDAR_MONTH:
      return {
        modifier: 'LAST',
        dateUnit: 'MONTH',
        numIntervals: 1,
        includeCurrentInterval: false,
      };
    case RELATIVE_DATE_TYPE.PREVIOUS_QUARTER:
      return {
        modifier: 'LAST',
        dateUnit: 'QUARTER',
        numIntervals: 1,
        includeCurrentInterval: false,
      };
    case RELATIVE_DATE_TYPE.PREVIOUS_CALENDAR_YEAR:
      return {
        modifier: 'LAST',
        dateUnit: 'YEAR',
        numIntervals: 1,
        includeCurrentInterval: false,
      };
    case RELATIVE_DATE_TYPE.CURRENT_FISCAL_QUARTER:
      return { modifier: 'THIS', dateUnit: 'FISCAL_QUARTER' };
    case RELATIVE_DATE_TYPE.CURRENT_FISCAL_HALF:
      return { modifier: 'THIS', dateUnit: 'FISCAL_HALF' };
    case RELATIVE_DATE_TYPE.CURRENT_FISCAL_YEAR:
      return { modifier: 'THIS', dateUnit: 'FISCAL_YEAR' };
    case RELATIVE_DATE_TYPE.PREVIOUS_FISCAL_QUARTER:
      return {
        modifier: 'LAST',
        dateUnit: 'FISCAL_QUARTER',
        numIntervals: 1,
        includeCurrentInterval: false,
      };
    case RELATIVE_DATE_TYPE.PREVIOUS_FISCAL_HALF:
      return {
        modifier: 'LAST',
        dateUnit: 'FISCAL_HALF',
        numIntervals: 1,
        includeCurrentInterval: false,
      };
    case RELATIVE_DATE_TYPE.PREVIOUS_FISCAL_YEAR:
      return {
        modifier: 'LAST',
        dateUnit: 'FISCAL_YEAR',
        numIntervals: 1,
        includeCurrentInterval: false,
      };
    case RELATIVE_DATE_TYPE.LAST_365_DAYS:
      return {
        modifier: 'LAST',
        dateUnit: 'DAY',
        numIntervals: 365,
        includeCurrentInterval: false,
      };
    case RELATIVE_DATE_TYPE.ALL_TIME:
      return {
        modifier: 'ALL_TIME',
        calendarType: DatePickerSettings.current().defaultCalendarType(),
      };
    default: {
      const range = getDefaultGregorianDateRangeMoment();
      return {
        modifier: 'BETWEEN',
        calendarType: DatePickerSettings.current().defaultCalendarType(),
        range: {
          from: range.startDate.momentView(),
          to: range.endDate.momentView(),
        },
      };
    }
  }
}
