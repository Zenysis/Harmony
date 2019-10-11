import PropTypes from 'prop-types';
import React, { Component } from 'react';
import moment from 'moment';
import { toEthiopian } from 'ethiopian-date';

import autobind from 'decorators/autobind';
import {
  DATE_FORMAT,
  getCurrentEthiopianYear,
  toGregorianStartDate,
  toGregorianEndDate,
} from 'util/dateUtil';

const MIN_ETHIOPIAN_YEAR = 2007;
const MAX_ETHIOPIAN_YEAR = 2010;

const TEXT = t('dashboard_builder.dashboard_filter');
const propTypes = {
  displayLabel: PropTypes.bool,
  year: PropTypes.string.isRequired,
  onUpdateStartDate: PropTypes.func.isRequired, // f(startDate: string)
  onUpdateEndDate: PropTypes.func.isRequired, // f(endDate: string)
  useEthiopianYear: PropTypes.bool,
};

const defaultProps = {
  displayLabel: true,
  useEthiopianYear: false,
};

function renderYearOptions() {
  //  keep in case we are actually doing gregorian
  const yearOptions = [];
  for (let year = 2010; year <= moment().year(); year++) {
    yearOptions.push(
      <option key={year} value={year}>
        {year}
      </option>,
    );
  }
  return yearOptions;
}

function renderEthiopianYearOptions() {
  const yearOptions = [];
  for (
    let year = MIN_ETHIOPIAN_YEAR;
    year <= Math.min(MAX_ETHIOPIAN_YEAR, getCurrentEthiopianYear());
    year++
  ) {
    yearOptions.push(
      <option key={year} value={year}>
        {year}
      </option>,
    );
  }
  return yearOptions;
}

function ethiopianFiscalYearToGregorian(fiscalYear) {
  // Start date is inclusive.
  const gregorianStart = `${fiscalYear + 7}-07-08`;

  // End date is *exclusive*.
  const gregorianEnd = `${fiscalYear + 8}-07-08`;
  return [gregorianStart, gregorianEnd];
}

export default class SelectYearContainer extends Component {
  @autobind
  onUpdateGregorianYear(e) {
    const year = parseInt(e.target.value, 10);
    const startDate = moment([year, 0, 1]).format(DATE_FORMAT);
    const endDate = moment([year + 1, 0, 1]).format(DATE_FORMAT);
    this.props.onUpdateStartDate(startDate);
    this.props.onUpdateEndDate(endDate);
  }

  @autobind
  onUpdateEthiopianYear(e) {
    // NOTE(ian): We are querying by EFY, not by normal Ethiopian year!
    const selectedYear = parseInt(e.target.value, 10);
    const [startDate, endDate] = ethiopianFiscalYearToGregorian(selectedYear);
    this.props.onUpdateStartDate(startDate);
    this.props.onUpdateEndDate(endDate);
  }

  maybeRenderLabel() {
    if (!this.props.displayLabel) {
      return null;
    }

    const dateLabel = this.props.useEthiopianYear
      ? TEXT.ethiopian_date_label
      : TEXT.date_label;
    return <label className="control-label">{dateLabel}</label>;
  }

  render() {
    const yearOptions = this.props.useEthiopianYear
      ? renderEthiopianYearOptions()
      : renderYearOptions();
    const onUpdate = this.props.useEthiopianYear
      ? this.onUpdateEthiopianYear
      : this.onUpdateGregorianYear;
    const dateLabel = this.props.useEthiopianYear
      ? TEXT.ethiopian_date_label
      : TEXT.date_label;
    const defaultValue = this.props.useEthiopianYear
      ? Math.min(MAX_ETHIOPIAN_YEAR, getCurrentEthiopianYear())
      : moment().year();
    return (
      <div className="select-year-container">
        {this.maybeRenderLabel()}
        <select
          className="form-control"
          defaultValue={defaultValue}
          onChange={onUpdate}
          title={dateLabel}
          data-live-search="true"
        >
          {yearOptions}
        </select>
      </div>
    );
  }
}

SelectYearContainer.propTypes = propTypes;
SelectYearContainer.defaultProps = defaultProps;
