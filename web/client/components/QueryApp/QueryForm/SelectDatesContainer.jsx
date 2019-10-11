// @flow
import * as React from 'react';

import SelectAbsoluteDate from 'components/QueryApp/QueryForm/SelectAbsoluteDate';
import SelectEthiopianDates from 'components/QueryApp/QueryForm/SelectEthiopianDates';
import SelectRelativeDate from 'components/QueryApp/QueryForm/SelectRelativeDate';
import autobind from 'decorators/autobind';
import { noop } from 'util/util';
import type { RelativeDateType } from 'components/QueryApp/QueryForm/SelectRelativeDate';

export type DateType =
  | 'CUSTOM'
  | 'ET_CHOOSE_MONTHS'
  | RelativeDateType;

type Props = {
  dateType: DateType,
  startDate: string,
  endDate: string,

  disabled: boolean,
  displayLabel: boolean,

  // NOTE(stephen): Use this method if changes must be committed in a single
  // call. This is a workaround to the design mess of this component and its
  // children.
  onUpdate: (
    dateType: DateType,
    startDate: string,
    endDate: string,
  ) => void,

  // If you only need to subscribe to individual change events, use these
  // methods.
  onUpdateDateType: (dateType: DateType) => void,
  onUpdateStartDate: (startDate: string) => void,
  onUpdateEndDate: (endDate: string) => void,
};

const ET_DATE_TYPE = 'ET_CHOOSE_MONTHS';

export default class SelectDatesContainer extends React.PureComponent<Props> {
  static defaultProps = {
    disabled: false,
    displayLabel: true,
    onUpdate: noop,
    onUpdateDateType: noop,
    onUpdateStartDate: noop,
    onUpdateEndDate: noop,
  };

  @autobind
  onUpdateStartDate(startDate: string) {
    const { dateType, endDate } = this.props;
    this.onUpdate(dateType, startDate, endDate);
  }

  @autobind
  onUpdateEndDate(endDate: string) {
    const { dateType, startDate } = this.props;
    this.onUpdate(dateType, startDate, endDate);
  }

  @autobind
  onUpdateEthiopianDates(startDate: string, endDate: string) {
    this.onUpdate(this.props.dateType, startDate, endDate);
  }

  @autobind
  onUpdate(newDateType: DateType, newStartDate?: string, newEndDate?: string) {
    // Support legacy behavior where all changes were in different listeners.
    const {
      onUpdate,
      onUpdateDateType,
      onUpdateStartDate,
      onUpdateEndDate,
    } = this.props;
    let { dateType, startDate, endDate } = this.props;
    if (newDateType !== dateType) {
      dateType = newDateType;
      onUpdateDateType(newDateType);
    }
    if (newStartDate !== undefined && newStartDate !== startDate) {
      startDate = newStartDate;
      onUpdateStartDate(newStartDate);
    }
    if (newEndDate !== undefined && newEndDate !== endDate) {
      endDate = newEndDate;
      onUpdateEndDate(newEndDate);
    }
    onUpdate(dateType, startDate, endDate);
  }

  maybeRenderAbsoluteDateSelector() {
    if (this.props.dateType !== 'CUSTOM') {
      return null;
    }

    return (
      <div className="row">
        <div className="col-md-6">
          <SelectAbsoluteDate
            label={t('query_form.select_date.start.label')}
            defaultDate={this.props.startDate}
            onUpdate={this.onUpdateStartDate}
            disabled={this.props.disabled}
          />
        </div>
        <div className="col-md-6">
          <SelectAbsoluteDate
            label={t('query_form.select_date.end.label')}
            defaultDate={this.props.endDate}
            onUpdate={this.onUpdateEndDate}
            disabled={this.props.disabled}
            displayInclusiveDates
          />
        </div>
      </div>
    );
  }

  maybeRenderEthiopianDateSelector() {
    if (this.props.dateType !== ET_DATE_TYPE) {
      return null;
    }

    return (
      <SelectEthiopianDates
        onUpdate={this.onUpdateEthiopianDates}
        disabled={this.props.disabled}
        startDate={this.props.startDate}
        endDate={this.props.endDate}
      />
    );
  }

  renderDateSelector() {
    const label = this.props.displayLabel
      ? t('query_form.select_relative_date.label')
      : '';

    return (
      <SelectRelativeDate
        selection={this.props.dateType}
        label={label}
        onUpdate={this.onUpdate}
        disabled={this.props.disabled}
      />
    );
  }

  render() {
    return (
      <span>
        {this.renderDateSelector()}
        {this.maybeRenderAbsoluteDateSelector()}
        {this.maybeRenderEthiopianDateSelector()}
      </span>
    );
  }
}
