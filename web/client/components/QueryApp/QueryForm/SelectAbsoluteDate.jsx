// @flow
import * as React from 'react';
import invariant from 'invariant';
import moment from 'moment';

import autobind from 'decorators/autobind';
import { DATE_FORMAT } from 'util/dateUtil';
import { uniqueId } from 'util/util';

type JQueryDatePicker = JQuery & {
  datepicker: (...any) => JQueryDatePicker,
};

type Props = {
  onUpdate: (date: string) => void,
  defaultDate: string,

  displayInclusiveDates: boolean,
  disabled: boolean,
  label: string,
};

export default class SelectAbsoluteDate extends React.Component<Props> {
  static defaultProps = {
    displayInclusiveDates: false,
    disabled: false,
    label: '',
  };

  _pickerRef: $RefObject<'input'> = React.createRef();
  _id: string = `datepicker__${uniqueId()}`;
  $datePickerElt: JQueryDatePicker;

  componentDidMount() {
    invariant(
      this._pickerRef.current,
      'Refs cannot be null inside componentDidMount',
    );
    this.$datePickerElt = (($(this._pickerRef.current): any): JQueryDatePicker);
    this.$datePickerElt
      .datepicker({
        container: `#${this._id}`,
        format: 'yyyy-mm-dd',
        orientation: 'left top',
      })
      .on('changeDate', () => {
        this.props.onUpdate(this.getInternalDate(this.$datePickerElt.val()));
      });
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.defaultDate !== this.props.defaultDate) {
      this.$datePickerElt.datepicker(
        'update',
        this.getDisplayDate(this.props.defaultDate),
      );
    }
  }

  @autobind
  iconClick() {
    this.$datePickerElt.focus();
  }

  /**
   * Modify a user input date for internal storage. If this control displays
   * inclusive dates, the user input is need to be bumped upward because we
   * store the date in exclusive format.
   * @param {string} dateStr
   *   String representation of a date
   * @return String representation of a date, possibly adjusted.
   */
  @autobind
  getInternalDate(dateStr: string): string {
    if (this.props.displayInclusiveDates) {
      return moment(dateStr)
        .add(1, 'days')
        .format(DATE_FORMAT);
    }
    return moment(dateStr).format(DATE_FORMAT);
  }

  /**
   * Modify a date for user display. If this control displays inclusive dates,
   * the date string is (user date + 1), so adjust the date downward.
   * @param {string} dateStr
   *   String representation of a date
   * @return String representation of a date, possibly adjusted.
   */
  @autobind
  getDisplayDate(dateStr: string): string {
    if (this.props.displayInclusiveDates) {
      return moment(dateStr)
        .subtract(1, 'days')
        .format(DATE_FORMAT);
    }
    return dateStr;
  }

  render() {
    return (
      <div className="form-group">
        <label className="control-label">{this.props.label}</label>
        <div>
          <div className="input-group" id={this._id}>
            <input
              className="form-control input-md datepicker"
              type="text"
              required
              ref={this._pickerRef}
              defaultValue={this.getDisplayDate(this.props.defaultDate)}
              disabled={this.props.disabled}
            />
            <div
              className="input-group-addon calendar-input"
              onClick={this.iconClick}
              role="button"
            >
              <i className="glyphicon glyphicon-calendar" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
