// @flow
import moment from 'moment';

import type { DateConfiguration } from 'components/ui/DatePicker/types';

export default function isDateConfigurationValid(
  dateConfig: DateConfiguration,
): boolean {
  switch (dateConfig.modifier) {
    case 'THIS':
      return true;
    case 'LAST':
      return dateConfig.numIntervals > 0;
    case 'BETWEEN': {
      const { from, to } = dateConfig.range;
      // dates must exist and be in the correct order
      return (
        from != null &&
        to != null &&
        moment(to).isSameOrAfter(from) &&
        moment(from).isSameOrBefore(to)
      );
    }
    case 'SINCE': {
      const { date } = dateConfig;
      return date !== undefined && moment(date).isSameOrBefore(moment(), 'day');
    }
    case 'ALL_TIME':
      return true;
    case 'YEAR_TO_DATE':
      // do not allow negative numbers of `numYearsLookback`
      return dateConfig.numYearsLookback >= 0;
    default:
      (dateConfig.modifier: empty);
      throw new Error(`Invalid modifier received: ${dateConfig.modifier}`);
  }
}
