// @flow
import * as React from 'react';
import moment from 'moment';

import SelectWithGroups from 'components/select_with_groups';
import autobind from 'decorators/autobind';
import { DATE_FORMAT, getDefaultGregorianDateRangeMoment } from 'util/dateUtil';
import { getDateDisplayName, US_DATE_VALS, ET_DATE_VALS } from 'selection_util';
import type { DateType } from 'components/QueryApp/QueryForm/SelectDatesContainer';

export type RelativeDateType =
  | 'CURRENT_CALENDAR_MONTH'
  | 'CURRENT_QUARTER'
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

const ENABLE_ET_DATES = window.__JSON_FROM_BACKEND.enableEtDateSelection;
const MIN_DATA_DATE = window.__JSON_FROM_BACKEND.ui.minDataDate;
const MAX_DATA_DATE = window.__JSON_FROM_BACKEND.ui.maxDataDate;
const FISCAL_START_MONTH = window.__JSON_FROM_BACKEND.fiscalStartMonth;

const ET_CALENDAR_OPTION = {
  groupLabel: t('query_form.select_date.et_calendar_title'),
  childOptions: ET_DATE_VALS.map(val => ({
    value: val,
    label: getDateDisplayName(val),
  })),
};

const DEFAULT_CALENDAR_OPTION = {
  groupLabel: ENABLE_ET_DATES
    ? t('query_form.select_date.western_calendar_title')
    : t('query_form.select_date.default_calendar_title'),
  childOptions: US_DATE_VALS.map(val => ({
    value: val,
    label: getDateDisplayName(val),
  })),
};

export const RELATIVE_DATE_TYPE: { [RelativeDateType]: RelativeDateType } = {
  CURRENT_CALENDAR_MONTH: 'CURRENT_CALENDAR_MONTH',
  CURRENT_QUARTER: 'CURRENT_QUARTER',
  PREVIOUS_CALENDAR_DAY: 'PREVIOUS_CALENDAR_DAY',
  PREVIOUS_CALENDAR_WEEK: 'PREVIOUS_CALENDAR_WEEK',
  PREVIOUS_CALENDAR_MONTH: 'PREVIOUS_CALENDAR_MONTH',
  PREVIOUS_CALENDAR_YEAR: 'PREVIOUS_CALENDAR_YEAR',
  CURRENT_FISCAL_QUARTER: 'CURRENT_FISCAL_QUARTER',
  CURRENT_FISCAL_YEAR: 'CURRENT_FISCAL_YEAR',
  PREVIOUS_FISCAL_QUARTER: 'PREVIOUS_FISCAL_QUARTER',
  PREVIOUS_FISCAL_YEAR: 'PREVIOUS_FISCAL_YEAR',
  LAST_365_DAYS: 'LAST_365_DAYS',
  PREVIOUS_QUARTER: 'PREVIOUS_QUARTER',
  FORECAST: 'FORECAST',
  ALL_TIME: 'ALL_TIME',
};

/**
 * Generate the start/end date (in absolute dates) inside the fiscal calendar
 * system of the current deployment.
 */
function buildRelativeFiscalDates(
  bucket: 'quarter' | 'year',
  previous: boolean = false,
): [moment, moment] {
  // If we are calculating the previous quarter/year, subtract 1 quarter/year
  // from the current date.
  const previousBucketOffset = previous ? 1 : 0;

  // By subtracting the fiscal start month from the date, we can still use
  // moment date functions (like startOf Quarter and startOf Year) like normal
  // to produce the correct date.
  const fiscalOffset = FISCAL_START_MONTH - 1;
  const startDate = moment()
    .subtract(previousBucketOffset, bucket)
    .subtract(fiscalOffset, 'month')
    .startOf(bucket)
    .add(fiscalOffset, 'month');

  const endDate = startDate.clone().add(1, bucket);
  return [startDate, endDate];
}

export function computeRelativeDate(
  val: DateType,
): { startDate: string, endDate: string } {
  let startDate;
  let endDate;

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
      [startDate, endDate] = buildRelativeFiscalDates('quarter');
      break;
    case RELATIVE_DATE_TYPE.CURRENT_FISCAL_YEAR:
      [startDate, endDate] = buildRelativeFiscalDates('year');
      break;
    case RELATIVE_DATE_TYPE.PREVIOUS_FISCAL_QUARTER:
      [startDate, endDate] = buildRelativeFiscalDates('quarter', true);
      break;
    case RELATIVE_DATE_TYPE.PREVIOUS_FISCAL_YEAR:
      [startDate, endDate] = buildRelativeFiscalDates('year', true);
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

type Props = {
  selection: DateType,
  label: string,
  onUpdate: (
    dateType: DateType,
    startDate: string | void,
    endDate: string | void,
  ) => void,

  disabled: boolean,
};

export default class SelectRelativeDate extends React.Component<Props> {
  static defaultProps = {
    disabled: false,
  };

  @autobind
  handleChange({ value }: { value: DateType }) {
    // Only compute a new date if the option selected is a relative date type.
    // $FlowIndexerIssue
    if (RELATIVE_DATE_TYPE[value] !== undefined) {
      const { startDate, endDate } = computeRelativeDate(value);
      this.props.onUpdate(value, startDate, endDate);
    } else {
      this.props.onUpdate(value, undefined, undefined);
    }
  }

  maybeRenderLabel() {
    if (!this.props.label.length) {
      return null;
    }
    return (
      <label htmlFor="select-relative-date" className="control-label">
        {this.props.label}
      </label>
    );
  }

  render() {
    const calendarOptions = ENABLE_ET_DATES
      ? [ET_CALENDAR_OPTION, DEFAULT_CALENDAR_OPTION]
      : [DEFAULT_CALENDAR_OPTION];

    return (
      <div className="form-group">
        {this.maybeRenderLabel()}
        <SelectWithGroups
          name="select-relative-date"
          value={this.props.selection}
          onChange={this.handleChange}
          options={calendarOptions}
          clearable={false}
          disabled={this.props.disabled}
        />
      </div>
    );
  }
}
