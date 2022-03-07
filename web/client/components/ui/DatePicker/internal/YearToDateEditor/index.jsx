// @flow
import * as React from 'react';

import BetweenDateEditor from 'components/ui/DatePicker/internal/BetweenDateEditor';
import Checkbox from 'components/ui/Checkbox';
import DatePickerDispatch from 'components/ui/DatePicker/DatePickerDispatch';
import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';
import computeDateRange from 'components/ui/DatePicker/computeDateRange';
import type {
  CalendarType,
  CalendarTypeConfig,
} from 'components/ui/DatePicker/types';

type Props = {
  calendarType: CalendarType,
  enabledCalendarTypes: $ReadOnlyArray<CalendarTypeConfig>,
  numYearsLookback: number,
  usePreviousYear: boolean,
};

export default function YearToDateEditor({
  calendarType,
  numYearsLookback,
  enabledCalendarTypes,
  usePreviousYear,
}: Props): React.Node {
  const dispatch = React.useContext(DatePickerDispatch);

  const onUsePreviousYearChange = React.useCallback(
    usePrevious => {
      dispatch({
        usePreviousYear: usePrevious,
        type: 'YEAR_TO_DATE_USE_PREVIOUS_YEAR_CHANGE',
      });
    },
    [dispatch],
  );

  const onNumYearsLookbackChange = React.useCallback(
    numYears => {
      dispatch({
        type: 'YEAR_TO_DATE_YEARS_LOOKBACK_CHANGE',
        numYearsLookback: Number(numYears),
      });
    },
    [dispatch],
  );

  const numYearsInput = (
    <InputText
      disabled={!usePreviousYear}
      ariaName={I18N.text('Number of years to look back')}
      className="zen-year-to-date-editor__years-input"
      value={String(numYearsLookback)}
      onChange={onNumYearsLookbackChange}
      type="number"
      width={60}
      step="1"
    />
  );

  const dateRange = computeDateRange({
    usePreviousYear,
    numYearsLookback,
    modifier: 'YEAR_TO_DATE',
  });

  const dateRangeString = React.useMemo(() => {
    const { from, to } = dateRange;
    return `${from.format('YYYY-MM-DD')}-${to.format('YYYY-MM-DD')}`;
  }, [dateRange]);

  return (
    <>
      <Checkbox
        label={
          <I18N
            numYearsInput={numYearsInput}
            pluralizedYear={
              numYearsLookback === 1 ? I18N.text('year') : I18N.text('years')
            }
          >
            Get year to date of the same period %(numYearsInput)s
            %(pluralizedYear)s ago
          </I18N>
        }
        onChange={onUsePreviousYearChange}
        value={usePreviousYear}
      />
      <BetweenDateEditor
        key={dateRangeString}
        enabledCalendarTypes={enabledCalendarTypes}
        calendarType={calendarType}
        initialDateRange={dateRange}
      />
    </>
  );
}
