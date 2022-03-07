// @flow
import * as React from 'react';

import CalendarTypeRadioGroup, {
  findCalendarType,
} from 'components/ui/DatePicker/internal/CalendarTypeRadioGroup';
import DatePickerDispatch from 'components/ui/DatePicker/DatePickerDispatch';
import I18N from 'lib/I18N';
import RangeEthiopianCalendarEditor from 'components/ui/DatePicker/internal/BetweenDateEditor/RangeEthiopianCalendarEditor';
import RangeGregorianCalendarEditor from 'components/ui/DatePicker/internal/BetweenDateEditor/RangeGregorianCalendarEditor';
import normalizeARIAName from 'components/ui/util/normalizeARIAName';
import type {
  CalendarType,
  CalendarTypeConfig,
  DateRange,
} from 'components/ui/DatePicker/types';

type Props = {
  calendarType: CalendarType,
  enabledCalendarTypes: $ReadOnlyArray<CalendarTypeConfig>,
  initialDateRange: DateRange,
};

export default function BetweenDateEditor({
  calendarType,
  enabledCalendarTypes,
  initialDateRange,
}: Props): React.Node {
  const dispatch = React.useContext(DatePickerDispatch);
  const onDateRangeChange = React.useCallback(
    (dateRange: DateRange) => {
      dispatch({
        dateRange,
        type: 'DATE_RANGE_CHANGE',
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
      aria-label={normalizeARIAName(I18N.text('Calendar date range picker'))}
    >
      {enabledCalendarTypes.length > 1 && (
        <CalendarTypeRadioGroup
          calendarTypes={enabledCalendarTypes}
          selectedCalendarType={calendarType}
        />
      )}
      {calendarTypeConfig.type === 'ETHIOPIAN' && (
        <RangeEthiopianCalendarEditor
          initialDateRange={initialDateRange}
          onDateRangeChange={onDateRangeChange}
          minimumEthiopianYear={calendarTypeConfig.minimumEthiopianYear}
        />
      )}
      {calendarTypeConfig.type === 'GREGORIAN' && (
        <RangeGregorianCalendarEditor
          initialDateRange={initialDateRange}
          onDateRangeChange={onDateRangeChange}
        />
      )}
    </div>
  );
}
