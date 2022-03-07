// @flow
import * as React from 'react';
import DayPicker from 'react-day-picker';
import classNames from 'classnames';
import moment from 'moment';

import CalendarDateInput from 'components/ui/DatePicker/internal/CalendarDateInput';
import I18N from 'lib/I18N';
import dateToMoment from 'components/ui/DatePicker/dateToMoment';
import momentToDate from 'components/ui/DatePicker/momentToDate';
import usePrevious from 'lib/hooks/usePrevious';

type Props = {
  initialDate: moment$Moment | void,

  // callback for when the date changes to a valid date
  onDateChange: (date: moment$Moment | void) => void,
};

const TEXT = t('ui.DatePicker.CalendarEditor');

const TODAY = moment();

export default function SinceGregorianCalendarEditor({
  initialDate,
  onDateChange,
}: Props): React.Node {
  const [selectedDate, setSelectedDate] = React.useState<Date | void>(
    momentToDate(initialDate),
  );

  // the date input used in the InputText. Stored as a Moment date so
  // it's easier to support multiple date formats
  const [dateInput, setDateInput] = React.useState<moment$Moment | void>(() =>
    initialDate ? moment(initialDate) : undefined,
  );
  const prevSelectedDate = usePrevious(selectedDate);

  // the calendar month to display, used by react-day-picker
  const [calendarMonth, setCalendarMonth] = React.useState(
    momentToDate(initialDate) || new Date(),
  );

  const onDayClick = (day: Date) => {
    setSelectedDate(day);
    setDateInput(moment(day));
  };

  const onDateInputChange = React.useCallback(
    (momentDate: moment$Moment | void) => {
      const date =
        momentDate !== undefined && momentDate.isValid()
          ? momentDate.toDate()
          : undefined;
      if (date !== undefined) {
        setCalendarMonth(date);
      }
      setDateInput(momentDate);
      setSelectedDate(date);
    },
    [],
  );

  // after rendering, check if selectedDate has changed and if so then
  // call the onDateChange callback
  React.useEffect(() => {
    if (selectedDate !== prevSelectedDate) {
      onDateChange(dateToMoment(selectedDate));
    }
  }, [selectedDate, prevSelectedDate, onDateChange]);

  // disable the today button if the calendar is currently displaying the same
  // month as today
  const disableTodayButton = moment(calendarMonth).isSame(moment(), 'month');
  const calendarClassName = classNames('zen-calendar-editor__calendar', {
    'zen-calendar-editor__calendar--disable-today-btn': disableTodayButton,
  });

  return (
    <div className="zen-calendar-editor">
      <div className="zen-calendar-editor__input-row">
        <CalendarDateInput
          ariaName={I18N.text('Enter date')}
          fullWidth
          date={dateInput}
          onChange={onDateInputChange}
          invalidMessage={TEXT.invalidDateMsg}
          maxDate={TODAY}
        />
      </div>
      <div className="zen-calendar-editor__calendar-container">
        <DayPicker
          className={calendarClassName}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          onDayClick={onDayClick}
          selectedDays={selectedDate}
          modifiers={{ start: selectedDate }}
          todayButton={TEXT.today}
        />
      </div>
    </div>
  );
}
