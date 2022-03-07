// @flow
import * as React from 'react';

import EthiopianDateSelector from 'components/ui/DatePicker/internal/EthiopianDateSelector';
import type { DateRange } from 'components/ui/DatePicker/types';

type Props = {
  initialDateRange: DateRange,
  minimumEthiopianYear: number,
  onDateRangeChange: (range: DateRange) => void,
};

const TEXT = t('ui.DatePicker.RangeEthiopianCalendarEditor');

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
        label={TEXT.startDate}
        initialDate={startDate}
        onDateChange={onStartDateChange}
        className="zen-ethiopian-date-selector-start"
        minimumEthiopianYear={minimumEthiopianYear}
      />
      <EthiopianDateSelector
        label={TEXT.endDate}
        initialDate={endDate}
        onDateChange={onEndDateChange}
        minimumEthiopianYear={minimumEthiopianYear}
      />
    </>
  );
}
