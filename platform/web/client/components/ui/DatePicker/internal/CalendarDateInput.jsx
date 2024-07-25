// @flow
import * as React from 'react';
import moment from 'moment';

import InputText from 'components/ui/InputText';

type Props = {
  ariaName: string,
  date: moment$Moment | void,
  // should this input text take up the full width of the container?
  fullWidth?: boolean,

  invalidMessage: string,
  // the maximum allowable date for the user to input
  maxDate?: ?moment$Moment,
  // the minimum allowable date for the user to input
  minDate?: ?moment$Moment,

  onBlur?: (SyntheticFocusEvent<HTMLInputElement>) => void,
  // triggered whenever the date changes. The Moment date is not guaranteed to
  // be valid.
  onChange: (moment$Moment | void) => void,

  onFocus?: (SyntheticFocusEvent<HTMLInputElement>) => void,
};

const DATE_DISPLAY_FORMAT = 'D/M/YYYY';

const ALLOWED_DATE_FORMATS = [
  'YYYY-M-D',
  'MMM D YYYY',
  'MMMM D YYYY',
  'MMM D, YYYY',
  'MMMM D, YYYY',
  'D MMM YYYY',
  'D MMMM YYYY',
  'D MMM, YYYY',
  'D MMMM, YYYY',
  'D/M/YYYY',
  'M/D/YYYY',
  '[q]Q YYYY',
  '[Q]Q YYYY',
];

/**
 * This is an InputText that allows a user to enter a date manually, with a
 * variety of different allowed date formats, and also allows a date to be
 * changed via the `date` prop, so the component is both controlled and
 * uncontrolled.
 *
 * This makes the internals of the component hard to follow, but it's necessary
 * to allow the date to change via both the text input or a manual date
 * selection on the calendar.
 */
function CalendarDateInput({
  ariaName,
  date,
  invalidMessage,
  onChange,
  onBlur = undefined,
  onFocus = undefined,
  fullWidth = false,
  minDate = undefined,
  maxDate = undefined,
}: Props): React.Element<typeof InputText> {
  const minAllowedDate = React.useMemo(
    () => (minDate ? moment(minDate) : undefined),
    [minDate],
  );
  const maxAllowedDate = React.useMemo(
    () => (maxDate ? moment(maxDate) : undefined),
    [maxDate],
  );

  const [lastInput, setLastInput] = React.useState('');

  const onDateInputChange = (inputStr: string) => {
    const parsedDate =
      inputStr === ''
        ? undefined
        : moment(inputStr, ALLOWED_DATE_FORMATS, true);
    setLastInput(inputStr);
    onChange(parsedDate);
  };

  // check if the parsed date is valid
  const invalidDateStr = date !== undefined && !date.isValid();
  const beforeMinAllowedDate =
    date !== undefined &&
    minAllowedDate !== undefined &&
    date.isBefore(minAllowedDate, 'day');
  const afterMaxAllowedDate =
    date !== undefined &&
    maxAllowedDate !== undefined &&
    date.isAfter(maxAllowedDate, 'day');
  const dateNotInValidRange = beforeMinAllowedDate || afterMaxAllowedDate;

  let inputStr = '';
  if (date !== undefined) {
    inputStr = date.isValid() ? date.format(DATE_DISPLAY_FORMAT) : lastInput;
  }
  const caretOffset = inputStr.length - lastInput.length;

  return (
    <InputText
      ariaName={ariaName}
      caretAware
      caretOffset={caretOffset}
      invalid={invalidDateStr || dateNotInValidRange}
      invalidMessage={invalidMessage}
      onBlur={onBlur}
      onChange={onDateInputChange}
      onFocus={onFocus}
      value={inputStr}
      width={fullWidth ? '100%' : 199}
    />
  );
}

export default (React.memo(CalendarDateInput): React.AbstractComponent<Props>);
