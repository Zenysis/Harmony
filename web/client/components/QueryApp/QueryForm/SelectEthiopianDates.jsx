// @flow
import * as React from 'react';
import moment from 'moment';
import { toEthiopian, toGregorian } from 'ethiopian-date';

import autobind from 'decorators/autobind';
import { ETHIOPIAN_MONTHS } from 'components/ethiopian_time';

// They won't be able to query before this year.
const MIN_ETHIOPIAN_YEAR = 2005;
const START_LABEL = t('query_form.select_date.start.label');
const END_LABEL = t('query_form.select_date.end.label');

type Props = {
  endDate: string,
  onUpdate: (newStartDate: string, newEndDate: string) => void,
  startDate: string,

  disabled: boolean,
};

// Convert the date string to the corresponding Ethiopian date.
function dateStrToEthiopian(dateStr: string): [number, number, number] {
  const momentDate = moment.utc(dateStr);
  return toEthiopian(
    momentDate.year(),
    momentDate.month() + 1,
    momentDate.date(),
  );
}

// Convert the gregorian date array produced by toGregorian into a date
// string.
// NOTE(stephen): toGregorian is one-indexed for month, so we subtract one from
// the month to make it consistent with everything else in javascript.
function gregorianDateArrToStr([year, month, day]): string {
  return moment.utc([year, month - 1, day]).format('YYYY-MM-DD');
}

function getMonthOptions(): $ReadOnlyArray<React.Element<'option'>> {
  return (
    // Store ethiopian months 1-indexed since that is how toEthiopian will
    // return them.
    ETHIOPIAN_MONTHS.map((month, idx) => (
      <option key={`month_${idx + 1}`} value={idx + 1}>
        {month}
      </option>
    ))
  );
}

function getYearOptions(): $ReadOnlyArray<React.Element<'option'>> {
  const now = moment.utc();
  const currentEthiopianYear = toEthiopian(
    now.year(),
    now.month() + 1,
    now.date(),
  )[0];
  const ret = [];
  for (let i = MIN_ETHIOPIAN_YEAR; i <= currentEthiopianYear; i++) {
    ret.push(
      <option key={`year_${i}`} value={i}>
        {i}
      </option>,
    );
  }
  return ret;
}

const YEAR_OPTIONS = getYearOptions();
const MONTH_OPTIONS = getMonthOptions();

export default class SelectEthiopianDates extends React.PureComponent<Props> {
  static defaultProps = {
    disabled: false,
  };

  componentDidMount() {
    this.checkDates();
  }

  componentDidUpdate() {
    this.checkDates();
  }

  // Only Ethiopian month and year are shown as query form options. If the date
  // passed in is not clipped to the front of the ET month, update it so that
  // it is.
  checkDates(): void {
    // Convert the input date into its Ethiopian equivalent.
    const { startDate, endDate } = this.props;
    const ethiopianStart = dateStrToEthiopian(startDate);
    const ethiopianEnd = dateStrToEthiopian(endDate);

    // Set the date to day 1 of the month since we only allow month selection.
    // TODO(stephen): It's annoying to be operating on array indices and not on
    // a real object.
    ethiopianStart[2] = 1;
    ethiopianEnd[2] = 1;

    const newStartDate = gregorianDateArrToStr(toGregorian(ethiopianStart));
    const newEndDate = gregorianDateArrToStr(toGregorian(ethiopianEnd));

    // If changing the day of the month to the start of the month changed the
    // start or end date passed in, call the date change callback. The
    // Ethiopian date selector must operate on dates that fall on the first of
    // the month only.
    if (newStartDate !== startDate || newEndDate !== endDate) {
      this.props.onUpdate(newStartDate, newEndDate);
    }
  }

  @autobind
  onEndDateChange(year: number, month: number) {
    // The end date we store in the query is one month past the end date
    // selected since we want the picker to be inclusive.
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > ETHIOPIAN_MONTHS.length) {
      newMonth = 1;
      newYear += 1;
    }
    const gregorianDate = toGregorian([newYear, newMonth, 1]);
    const dateStr = gregorianDateArrToStr(gregorianDate);
    this.props.onUpdate(this.props.startDate, dateStr);
  }

  @autobind
  onStartDateChange(year: number, month: number) {
    const gregorianDate = toGregorian(year, month, 1);
    const dateStr = gregorianDateArrToStr(gregorianDate);
    this.props.onUpdate(dateStr, this.props.endDate);
  }

  renderMonthYearPicker(
    label: string,
    month: number,
    year: number,
    updateFn: (newYear: number, month: number) => void,
  ) {
    const onMonthChange = event => {
      const newMonth = parseInt(event.target.value, 10);
      updateFn(year, newMonth);
    };

    const onYearChange = event => {
      const newYear = parseInt(event.target.value, 10);
      updateFn(newYear, month);
    };

    return (
      <div className="col-sm-6">
        <label htmlFor="select-ethiopian-month" className="control-label">
          {label}
        </label>
        <div className="form-group">
          <div className="col-sm-7 ethiopian-date-selector">
            <select
              className="form-control"
              value={month}
              onChange={onMonthChange}
              disabled={this.props.disabled}
            >
              {MONTH_OPTIONS}
            </select>
          </div>
          <div className="col-sm-5 ethiopian-date-selector">
            <select
              className="form-control"
              value={year}
              onChange={onYearChange}
              disabled={this.props.disabled}
            >
              {YEAR_OPTIONS}
            </select>
          </div>
        </div>
      </div>
    );
  }

  renderEndDatePicker() {
    let [year, month] = dateStrToEthiopian(this.props.endDate);
    // NOTE(stephen): The ethiopian end date is **inclusive**. This means the
    // display index will always be one less than the date index.
    month -= 1;
    if (month < 1) {
      year -= 1;
      month = ETHIOPIAN_MONTHS.length;
    }

    return this.renderMonthYearPicker(
      END_LABEL,
      month,
      year,
      this.onEndDateChange,
    );
  }

  renderStartDatePicker() {
    const [year, month] = dateStrToEthiopian(this.props.startDate);

    return this.renderMonthYearPicker(
      START_LABEL,
      month,
      year,
      this.onStartDateChange,
    );
  }

  render() {
    return (
      <div className="row ethiopian-date-container">
        {this.renderStartDatePicker()}
        {this.renderEndDatePicker()}
      </div>
    );
  }
}
