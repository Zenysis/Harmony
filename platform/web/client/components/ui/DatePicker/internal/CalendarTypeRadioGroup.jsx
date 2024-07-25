// @flow
import * as React from 'react';
import invariant from 'invariant';

import DatePickerDispatch from 'components/ui/DatePicker/DatePickerDispatch';
import I18N from 'lib/I18N';
import RadioGroup from 'components/ui/RadioGroup';
import type {
  CalendarType,
  CalendarTypeConfig,
} from 'components/ui/DatePicker/types';

const CALENDAR_LOOKUP = {
  ETHIOPIAN: I18N.text('Ge’ez calendar'),
  GREGORIAN: I18N.text('Western calendar'),
};

type Props = {
  calendarTypes: $ReadOnlyArray<CalendarTypeConfig>,
  selectedCalendarType: CalendarType,
};

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
          className="zen-calendar-editor__radio-item"
          testId={config.type}
          value={config.type}
        >
          {config.displayName || CALENDAR_LOOKUP[config.type]}
        </RadioGroup.Item>
      )),
    [calendarTypes],
  );

  return (
    <RadioGroup
      className="zen-calendar-editor__calendar-type-picker-row"
      onChange={onChange}
      value={selectedCalendarType}
    >
      {calendarTypeOptions}
    </RadioGroup>
  );
}
