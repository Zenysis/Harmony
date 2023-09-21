// @flow
/* eslint-disable */
import * as React from 'react';
import DayPicker from 'react-day-picker';

import I18N from 'lib/I18N';

type Props = {
  className: string,
  modifiers: Object,
  month: Date,
  numberOfMonths?: number,
  onDayClick: function,
  onDayMouseEnter?: function,
  onMonthChange: function,
  selectedDays: any | Date,
  todayButton: string,
};

type Weekday = {
  full: string,
  min: string,
  short: string,
};

type Weekdays = {
  SUNDAY: Weekday,
  MONDAY: Weekday,
  TUESDAY: Weekday,
  WEDNESDAY: Weekday,
  THURSDAY: Weekday,
  FRIDAY: Weekday,
  SATURDAY: Weekday,
};

type Months = {
  JANUARY: string,
  FEBRUARY: string,
  MARCH: string,
  APRIL: string,
  MAY: string,
  JUNE: string,
  JULY: string,
  AUGUST: string,
  SEPTEMBER: string,
  OCTOBER: string,
  NOVEMBER: string,
  DECEMBER: string,
};

export const WEEKDAYS: Weekdays = {
  SUNDAY: {
    full: I18N.text('Sunday'),
    short: I18N.text('Sun'),
    min: I18N.text('Su'),
  },
  MONDAY: {
    full: I18N.text('Monday'),
    short: I18N.text('Mon'),
    min: I18N.text('Mo'),
  },
  TUESDAY: {
    full: I18N.text('Tuesday'),
    short: I18N.text('Tue'),
    min: I18N.text('Tu'),
  },
  WEDNESDAY: {
    full: I18N.text('Wednesday'),
    short: I18N.text('Wed'),
    min: I18N.text('We'),
  },
  THURSDAY: {
    full: I18N.text('Thursday'),
    short: I18N.text('Thu'),
    min: I18N.text('Th'),
  },
  FRIDAY: {
    full: I18N.text('Friday'),
    short: I18N.text('Fri'),
    min: I18N.text('Fr'),
  },
  SATURDAY: {
    full: I18N.text('Saturday'),
    short: I18N.text('Sat'),
    min: I18N.text('Sa'),
  },
};

export const MONTHS: Months = {
  JANUARY: I18N.text('January'),
  FEBRUARY: I18N.text('February'),
  MARCH: I18N.text('March'),
  APRIL: I18N.text('April'),
  MAY: I18N.text('May'),
  JUNE: I18N.text('June'),
  JULY: I18N.text('July'),
  AUGUST: I18N.text('August'),
  SEPTEMBER: I18N.text('September'),
  OCTOBER: I18N.text('October'),
  NOVEMBER: I18N.text('November'),
  DECEMBER: I18N.text('December'),
};

const flatWeekdays = key => Object.values(WEEKDAYS).map((v: Object) => v[key]);

const ZenDayPicker = (props: Props): React.Node => (
  <DayPicker
    months={Object.values(MONTHS)}
    weekdaysLong={flatWeekdays('full')}
    weekdaysShort={flatWeekdays('min')}
    {...props}
  />
);

export default ZenDayPicker;
