// @flow
import * as React from 'react';
import DayPicker, { DateUtils } from 'react-day-picker';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import moment from 'moment';

import CalendarDateInput from 'components/ui/DatePicker/internal/CalendarDateInput';
import I18N from 'lib/I18N';
import dateToMoment from 'components/ui/DatePicker/dateToMoment';
import momentToDate from 'components/ui/DatePicker/momentToDate';
import useCalendarFooterPortal from 'components/ui/DatePicker/internal/useCalendarFooterPortal';
import usePrevious from 'lib/hooks/usePrevious';
import type { DateRange } from 'components/ui/DatePicker/types';

type Props = {
  initialDateRange: DateRange,
  onDateRangeChange: (range: DateRange) => void,
};

// react-day-picker internally works with Day objects and not Moment objects
type ReactDatePickerRange = {
  +from: ?Date,
  +to: ?Date,
};

const TEXT = t('ui.DatePicker.CalendarEditor');

export default function RangeGregorianCalendarEditor({
  initialDateRange,
  onDateRangeChange,
}: Props): React.Node {
  const calendarFooterPortalNode = useCalendarFooterPortal();

  // the 'official' date range we have selected, used by react-day-picker
  const [dateRange, setDateRange] = React.useState<ReactDatePickerRange>(() => {
    if (initialDateRange) {
      return {
        from: momentToDate(initialDateRange.from),
        to: momentToDate(initialDateRange.to),
      };
    }
    return { from: undefined, to: undefined };
  });

  const [inputFocus, setInputFocus] = React.useState<'start' | 'end' | void>(
    undefined,
  );

  const onFocusStartDate = React.useCallback(() => setInputFocus('start'), []);
  const onFocusEndDate = React.useCallback(() => setInputFocus('end'), []);
  const onInputBlur = React.useCallback(event => {
    // get the element that we interacted with in order to cause the blur event
    const relatedElt = event.relatedTarget;
    if (
      relatedElt instanceof HTMLElement &&
      // NOTE(pablo): this is dangerous but is the only way we have to detect
      // if the react-day-picker's Day element was clicked
      [...relatedElt.classList].includes('DayPicker-Day')
    ) {
      // if the element we're blurring with is the DayPicker, then abort and
      // do not reset the input focus to undefined. We'll wait until after the
      // onDayClick is processed to do that.
      return;
    }
    setInputFocus(undefined);
  }, []);

  const prevDateRange = usePrevious(dateRange);

  // the date we are currently hovering over in the calendar
  const [hoveredDate, setHoveredDate] = React.useState<Date | void>(undefined);

  // the calendar month to display, used by react-day-picker
  const [calendarMonth, setCalendarMonth] = React.useState(
    momentToDate(initialDateRange.from) || new Date(),
  );

  // the From and To dates used in the InputTexts. Stored as Moment dates,
  // so it's easier to support multiple date formats
  const [
    fromDateInput,
    setFromDateInput,
  ] = React.useState<moment$Moment | void>(() =>
    initialDateRange.from ? moment(initialDateRange.from) : undefined,
  );
  const [toDateInput, setToDateInput] = React.useState<moment$Moment | void>(
    () => (initialDateRange.to ? moment(initialDateRange.to) : undefined),
  );

  const { from, to } = dateRange;

  // when the day changes because the user clicked on a calendar day
  const onDayClick = (day: Date) => {
    if (from == null) {
      setHoveredDate(undefined);
    }

    let newRange;

    // if a text input is currently focused on, then we'll change that input
    // when the calendar is clicked. For example, if the user clicked on the
    // 'start date' text field, then if the user then clicks on a calendar day,
    // we'll assume they are wanting to change the start date. If no text box
    // had a focus, then we'll use react-day-picker's default algorithm
    // `addDayToRange` to determine how to update the range.
    if (inputFocus === 'start') {
      let newEndDate;

      // if the old endDate is before the new start date, then reset it to empty
      if (dateRange.to) {
        newEndDate = moment(dateRange.to).isBefore(day, 'day')
          ? undefined
          : dateRange.to;
      }

      newRange = { from: day, to: newEndDate };
      setHoveredDate(undefined);
    } else if (inputFocus === 'end') {
      let newStartDate;

      // if the old startDate is after the new end date, then reset it to empty
      if (dateRange.from) {
        newStartDate = moment(dateRange.from).isAfter(day, 'day')
          ? undefined
          : dateRange.from;
      }

      newRange = { from: newStartDate, to: day };
      setHoveredDate(undefined);
    } else {
      newRange = (DateUtils.addDayToRange(
        day,
        dateRange,
      ): ReactDatePickerRange);
    }

    setDateRange(newRange);
    setFromDateInput(newRange.from ? moment(newRange.from) : undefined);
    setToDateInput(newRange.to ? moment(newRange.to) : undefined);
    setInputFocus(undefined);
  };

  const onDayMouseEnter = (day: Date) => {
    // if (from != null && to == null) {
    setHoveredDate(day);
    // }
  };

  const onCalendarMouseLeave = () => {
    if (from != null && to == null) {
      setHoveredDate(undefined);
    }
  };

  const onResetClick = () => {
    setDateRange({ from: undefined, to: undefined });
    setFromDateInput(undefined);
    setToDateInput(undefined);
  };

  // whent he date input changes by manually typing in a text field
  const onDateInputChange = React.useCallback(
    (key: 'from' | 'to', momentDate: moment$Moment | void) => {
      const date =
        momentDate !== undefined && momentDate.isValid()
          ? momentDate.toDate()
          : undefined;
      if (date !== undefined) {
        setCalendarMonth(date);
      }

      if (key === 'from') {
        setFromDateInput(momentDate);
        setDateRange(range => ({ ...range, from: date }));
      } else {
        setToDateInput(momentDate);
        setDateRange(range => ({ ...range, to: date }));
      }
    },
    [],
  );

  const onFromDateInputChange = React.useCallback(
    (momentDate: moment$Moment | void) => onDateInputChange('from', momentDate),
    [onDateInputChange],
  );

  const onToDateInputChange = React.useCallback(
    (momentDate: moment$Moment | void) => onDateInputChange('to', momentDate),
    [onDateInputChange],
  );

  // after rendering, check if the date range has changed, and if so then
  // call the onDateRangeChange callback
  React.useEffect(() => {
    if (prevDateRange !== undefined && dateRange !== prevDateRange) {
      onDateRangeChange({
        from: dateToMoment(dateRange.from || undefined),
        to: dateToMoment(dateRange.to || undefined),
      });
    }
  }, [dateRange, prevDateRange, onDateRangeChange]);

  const enableResetBtn = !!from && !!to;
  const resetBtnClassName = classNames('zen-calendar-editor__reset-btn', {
    'zen-calendar-editor__reset-btn--enabled': enableResetBtn,
    'zen-calendar-editor__reset-btn--disabled': !enableResetBtn,
  });

  // disable the today button if the calendar is currently displaying the same
  // month as today
  const disableTodayButton = moment(calendarMonth).isSame(moment(), 'month');
  const calendarClassName = classNames('zen-calendar-editor__calendar', {
    'zen-calendar-editor__calendar--disable-today-btn': disableTodayButton,
  });

  return (
    <>
      <div className="zen-calendar-editor__input-row">
        <CalendarDateInput
          ariaName={I18N.text('Enter start date')}
          date={fromDateInput}
          onChange={onFromDateInputChange}
          maxDate={dateToMoment(to)}
          invalidMessage={TEXT.startDateInvalidMsg}
          onFocus={onFocusStartDate}
          onBlur={onInputBlur}
        />
        <span className="zen-calendar-editor__and-text u-info-text">
          {TEXT.and}
        </span>
        <CalendarDateInput
          ariaName={I18N.text('Enter end date')}
          date={toDateInput}
          onChange={onToDateInputChange}
          minDate={dateToMoment(from)}
          invalidMessage={TEXT.endDateInvalidMsg}
          onFocus={onFocusEndDate}
          onBlur={onInputBlur}
        />
      </div>
      <div
        className="zen-calendar-editor__calendar-container"
        onMouseLeave={onCalendarMouseLeave}
      >
        <DayPicker
          className={calendarClassName}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          numberOfMonths={2}
          onDayClick={onDayClick}
          onDayMouseEnter={onDayMouseEnter}
          selectedDays={[
            from,
            { from: from || hoveredDate, to: to || hoveredDate },
          ]}
          modifiers={{ start: from, end: to || hoveredDate }}
          todayButton={TEXT.today}
        />
        {ReactDOM.createPortal(
          <>
            <span className="zen-calendar-editor__footer-divider">|</span>
            <span
              className={resetBtnClassName}
              role="button"
              onClick={enableResetBtn ? onResetClick : undefined}
            >
              {TEXT.reset}
            </span>
          </>,
          calendarFooterPortalNode,
        )}
      </div>
    </>
  );
}
