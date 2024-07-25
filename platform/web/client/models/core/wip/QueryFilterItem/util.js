// @flow
import moment from 'moment';

import CalendarSettings from 'models/config/CalendarSettings';
import DatePickerSettings from 'models/config/CalendarSettings/DatePickerSettings';
import I18N from 'lib/I18N';
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
  ALL_TIME: 'ALL_TIME',
  CURRENT_CALENDAR_MONTH: 'CURRENT_CALENDAR_MONTH',
  CURRENT_FISCAL_HALF: 'CURRENT_FISCAL_HALF',
  CURRENT_FISCAL_QUARTER: 'CURRENT_FISCAL_QUARTER',
  CURRENT_FISCAL_YEAR: 'CURRENT_FISCAL_YEAR',
  CURRENT_QUARTER: 'CURRENT_QUARTER',
  CURRENT_YEAR: 'CURRENT_YEAR',
  FORECAST: 'FORECAST',
  LAST_365_DAYS: 'LAST_365_DAYS',
  PREVIOUS_CALENDAR_DAY: 'PREVIOUS_CALENDAR_DAY',
  PREVIOUS_CALENDAR_MONTH: 'PREVIOUS_CALENDAR_MONTH',
  PREVIOUS_CALENDAR_WEEK: 'PREVIOUS_CALENDAR_WEEK',
  PREVIOUS_CALENDAR_YEAR: 'PREVIOUS_CALENDAR_YEAR',
  PREVIOUS_FISCAL_HALF: 'PREVIOUS_FISCAL_HALF',
  PREVIOUS_FISCAL_QUARTER: 'PREVIOUS_FISCAL_QUARTER',
  PREVIOUS_FISCAL_YEAR: 'PREVIOUS_FISCAL_YEAR',
  PREVIOUS_QUARTER: 'PREVIOUS_QUARTER',
};

export function computeRelativeDate(
  val: DateType,
): { endDate: string, startDate: string } {
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
      ({ endDate, startDate } = range);
      break;
    }
  }

  return {
    endDate: endDate.format(DATE_FORMAT),
    startDate: startDate.format(DATE_FORMAT),
  };
}

// TODO: $SQTDeprecate kill this function once the old date picker is killed off
export function relativeDateTypeToDateConfiguration(
  dateType: DateType,
): DateConfiguration {
  switch (dateType) {
    case RELATIVE_DATE_TYPE.CURRENT_CALENDAR_MONTH:
      return { dateUnit: 'MONTH', modifier: 'THIS' };
    case RELATIVE_DATE_TYPE.CURRENT_QUARTER:
      return { dateUnit: 'QUARTER', modifier: 'THIS' };
    case RELATIVE_DATE_TYPE.CURRENT_YEAR:
      return { dateUnit: 'YEAR', modifier: 'THIS' };
    case RELATIVE_DATE_TYPE.PREVIOUS_CALENDAR_DAY:
      return {
        dateUnit: 'DAY',
        includeCurrentInterval: false,
        modifier: 'LAST',
        numIntervals: 1,
      };
    case RELATIVE_DATE_TYPE.PREVIOUS_CALENDAR_WEEK:
      return {
        dateUnit: 'WEEK',
        includeCurrentInterval: false,
        modifier: 'LAST',
        numIntervals: 1,
      };
    case RELATIVE_DATE_TYPE.PREVIOUS_CALENDAR_MONTH:
      return {
        dateUnit: 'MONTH',
        includeCurrentInterval: false,
        modifier: 'LAST',
        numIntervals: 1,
      };
    case RELATIVE_DATE_TYPE.PREVIOUS_QUARTER:
      return {
        dateUnit: 'QUARTER',
        includeCurrentInterval: false,
        modifier: 'LAST',
        numIntervals: 1,
      };
    case RELATIVE_DATE_TYPE.PREVIOUS_CALENDAR_YEAR:
      return {
        dateUnit: 'YEAR',
        includeCurrentInterval: false,
        modifier: 'LAST',
        numIntervals: 1,
      };
    case RELATIVE_DATE_TYPE.CURRENT_FISCAL_QUARTER:
      return { dateUnit: 'FISCAL_QUARTER', modifier: 'THIS' };
    case RELATIVE_DATE_TYPE.CURRENT_FISCAL_HALF:
      return { dateUnit: 'FISCAL_HALF', modifier: 'THIS' };
    case RELATIVE_DATE_TYPE.CURRENT_FISCAL_YEAR:
      return { dateUnit: 'FISCAL_YEAR', modifier: 'THIS' };
    case RELATIVE_DATE_TYPE.PREVIOUS_FISCAL_QUARTER:
      return {
        dateUnit: 'FISCAL_QUARTER',
        includeCurrentInterval: false,
        modifier: 'LAST',
        numIntervals: 1,
      };
    case RELATIVE_DATE_TYPE.PREVIOUS_FISCAL_HALF:
      return {
        dateUnit: 'FISCAL_HALF',
        includeCurrentInterval: false,
        modifier: 'LAST',
        numIntervals: 1,
      };
    case RELATIVE_DATE_TYPE.PREVIOUS_FISCAL_YEAR:
      return {
        dateUnit: 'FISCAL_YEAR',
        includeCurrentInterval: false,
        modifier: 'LAST',
        numIntervals: 1,
      };
    case RELATIVE_DATE_TYPE.LAST_365_DAYS:
      return {
        dateUnit: 'DAY',
        includeCurrentInterval: false,
        modifier: 'LAST',
        numIntervals: 365,
      };
    case RELATIVE_DATE_TYPE.ALL_TIME:
      return {
        calendarType: DatePickerSettings.current().defaultCalendarType(),
        modifier: 'ALL_TIME',
      };
    default: {
      const range = getDefaultGregorianDateRangeMoment();
      return {
        calendarType: DatePickerSettings.current().defaultCalendarType(),
        modifier: 'BETWEEN',
        range: {
          from: range.startDate.momentView(),
          to: range.endDate.momentView(),
        },
      };
    }
  }
}

const DATE_DISPLAY_NAME_LOOKUP = {
  ALL_TIME: I18N.textById('All time'),
  CURRENT_CALENDAR_MONTH: I18N.text('Current calendar month'),
  CURRENT_QUARTER: I18N.text('Current quarter'),
  CURRENT_YEAR: I18N.text('Current year'),
  CUSTOM: I18N.textById('Custom'),
  ET_CHOOSE_MONTHS: I18N.text('Custom Ethiopian months'),
  FORECAST: I18N.text('Forecast'),
  LAST_365_DAYS: I18N.text('Last 365 days'),
  PREVIOUS_CALENDAR_DAY: I18N.text('Previous calendar day'),
  PREVIOUS_CALENDAR_MONTH: I18N.text('Previous calendar month'),
  PREVIOUS_CALENDAR_WEEK: I18N.text('Previous calendar week'),
  PREVIOUS_CALENDAR_YEAR: I18N.text('Previous calendar year'),
  PREVIOUS_QUARTER: I18N.text('Previous quarter'),
};

export const getDateDisplayName: string => string = val =>
  DATE_DISPLAY_NAME_LOOKUP[val];
