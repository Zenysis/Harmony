// @flow
import * as React from 'react';
import invariant from 'invariant';

import DatePickerDispatch from 'components/ui/DatePicker/DatePickerDispatch';
import RadioGroup from 'components/ui/RadioGroup';
import type {
  CalendarType,
  CalendarTypeConfig,
} from 'components/ui/DatePicker/types';

type Props = {
  calendarTypes: $ReadOnlyArray<CalendarTypeConfig>,
  selectedCalendarType: CalendarType,
};

const TEXT = t('ui.DatePicker.calendarTypes');

export function findCalendarType(
  calendarTypes: $ReadOnlyArray<CalendarTypeConfig>,
  typeToFind: CalendarType,
): CalendarTypeConfig {
  const calConfig = calendarTypes.find(cal => cal.type === typeToFind);
  invariant(
    calConfig,
    `Calendar type configuration for '${typeToFind}' was not supplied.`,
  );
  return calConfig;
}

export default function CalendarTypeRadioGroup({
  calendarTypes,
  selectedCalendarType,
}: Props): React.Node {
  const dispatch = React.useContext(DatePickerDispatch);
  const onChange = React.useCallback(
    (newCalendarType: CalendarType) => {
      dispatch({
        newCalendarType,
        type: 'CALENDAR_TYPE_CHANGE',
      });
    },
    [dispatch],
  );

  const calendarTypeOptions = React.useMemo(
    () =>
      calendarTypes.map(config => (
        <RadioGroup.Item
          key={config.type}
          value={config.type}
          className="zen-calendar-editor__radio-item"
          testId={config.type}
        >
          {config.displayName || TEXT[config.type]}
        </RadioGroup.Item>
      )),
    [calendarTypes],
  );

  return (
    <RadioGroup
      value={selectedCalendarType}
      onChange={onChange}
      className="zen-calendar-editor__calendar-type-picker-row"
    >
      {calendarTypeOptions}
    </RadioGroup>
  );
}
