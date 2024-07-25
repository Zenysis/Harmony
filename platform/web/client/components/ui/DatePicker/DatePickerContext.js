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
  defaultCalendarType: CalendarType,
  enabledDateGranularities: $ReadOnlyArray<DateGranularityConfig>,
  fiscalStartMonth: number,
  maxAllTimeDate?: moment$Moment,
  minAllTimeDate?: moment$Moment,
  quickOptions: $ReadOnlyArray<DateConfiguration>,
};

export default (React.createContext({
  defaultCalendarType: 'GREGORIAN',
  enabledDateGranularities: [],
  fiscalStartMonth: 1,
  maxAllTimeDate: undefined,
  minAllTimeDate: undefined,
  quickOptions: [],
}): React.Context<DatePickerContext>);
