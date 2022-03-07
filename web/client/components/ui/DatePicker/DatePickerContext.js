// @flow
import * as React from 'react';

import type {
  CalendarType,
  DateConfiguration,
  DateGranularityConfig,
} from 'components/ui/DatePicker/types';

/**
 * This context holds global properties about the Date Picker
 */
type DatePickerContext = {
  enabledDateGranularities: $ReadOnlyArray<DateGranularityConfig>,
  fiscalStartMonth: number,
  defaultCalendarType: CalendarType,
  quickOptions: $ReadOnlyArray<DateConfiguration>,
  maxAllTimeDate?: moment$Moment,
  minAllTimeDate?: moment$Moment,
};

export default (React.createContext({
  enabledDateGranularities: [],
  fiscalStartMonth: 1,
  quickOptions: [],
  defaultCalendarType: 'GREGORIAN',
  maxAllTimeDate: undefined,
  minAllTimeDate: undefined,
}): React.Context<DatePickerContext>);
