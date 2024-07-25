// @flow
import * as React from 'react';

import EthiopianDateSelector from 'components/ui/DatePicker/internal/EthiopianDateSelector';
import I18N from 'lib/I18N';
import type { DateRange } from 'components/ui/DatePicker/types';

type Props = {
  initialDateRange: DateRange,
  minimumEthiopianYear: number,
  onDateRangeChange: (range: DateRange) => void,
};

export default function RangeEthiopianCalendarEditor({
  initialDateRange,
  minimumEthiopianYear,
  onDateRangeChange,
}: Props): React.Node {
  const [startDate, setStartDate] = React.useState(initialDateRange.from);
  const [endDate, setEndDate] = React.useState(initialDateRange.to);

  const onStartDateChange = React.useCallback(
    (date: moment$Moment | void) => {
      setStartDate(date);
      onDateRangeChange({ from: date, to: endDate });
    },
    [endDate, onDateRangeChange],
  );

  const onEndDateChange = React.useCallback(
    (date: moment$Moment | void) => {
      setEndDate(date);
      onDateRangeChange({ from: startDate, to: date });
    },
    [startDate, onDateRangeChange],
  );

  return (
    <>
      <EthiopianDateSelector
        className="zen-ethiopian-date-selector-start"
        initialDate={startDate}
        label={I18N.text('Start date')}
        minimumEthiopianYear={minimumEthiopianYear}
        onDateChange={onStartDateChange}
      />
      <EthiopianDateSelector
        initialDate={endDate}
        label={I18N.text('End date')}
        minimumEthiopianYear={minimumEthiopianYear}
        onDateChange={onEndDateChange}
      />
    </>
  );
}
