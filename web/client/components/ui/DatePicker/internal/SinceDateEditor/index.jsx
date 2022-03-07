// @flow
import * as React from 'react';

import CalendarTypeRadioGroup, {
  findCalendarType,
} from 'components/ui/DatePicker/internal/CalendarTypeRadioGroup';
import DatePickerDispatch from 'components/ui/DatePicker/DatePickerDispatch';
import EthiopianDateSelector from 'components/ui/DatePicker/internal/EthiopianDateSelector';
import I18N from 'lib/I18N';
import SinceGregorianCalendarEditor from 'components/ui/DatePicker/internal/SinceDateEditor/SinceGregorianCalendarEditor';
import normalizeARIAName from 'components/ui/util/normalizeARIAName';
import type {
  CalendarType,
  CalendarTypeConfig,
} from 'components/ui/DatePicker/types';

type Props = {
  calendarType: CalendarType,
  enabledCalendarTypes: $ReadOnlyArray<CalendarTypeConfig>,
  initialDate: moment$Moment | void,
};

export default function SinceDateEditor({
  calendarType,
  enabledCalendarTypes,
  initialDate,
}: Props): React.Node {
  const dispatch = React.useContext(DatePickerDispatch);
  const onDateChange = React.useCallback(
    (date: moment$Moment | void) => {
      dispatch({
        date,
        type: 'SINCE_DATE_CHANGE',
      });
    },
    [dispatch],
  );

  const calendarTypeConfig = findCalendarType(
    enabledCalendarTypes,
    calendarType,
  );

  return (
    <div
      role="group"
      className="zen-calendar-editor"
      aria-label={normalizeARIAName(I18N.text('Calendar date picker'))}
    >
      {enabledCalendarTypes.length > 1 && (
        <CalendarTypeRadioGroup
          calendarTypes={enabledCalendarTypes}
          selectedCalendarType={calendarType}
        />
      )}
      {calendarTypeConfig.type === 'ETHIOPIAN' && (
        <EthiopianDateSelector
          initialDate={initialDate}
          onDateChange={onDateChange}
          minimumEthiopianYear={calendarTypeConfig.minimumEthiopianYear}
        />
      )}
      {calendarTypeConfig.type === 'GREGORIAN' && (
        <SinceGregorianCalendarEditor
          initialDate={initialDate}
          onDateChange={onDateChange}
        />
      )}
    </div>
  );
}
