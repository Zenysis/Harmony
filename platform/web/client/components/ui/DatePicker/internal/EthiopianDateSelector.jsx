// @flow
import * as React from 'react';
import moment from 'moment';
import { toEthiopian } from 'ethiopian-date';

import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import normalizeARIAName from 'components/ui/util/normalizeARIAName';
import { ETHIOPIAN_MONTHS } from 'util/dateUtil';
import {
  dateToEthiopian,
  ethiopianToDate,
} from 'components/ui/DatePicker/internal/ethiopianDateUtil';
import { range } from 'util/arrayUtil';

type Props = {
  className?: string,
  initialDate: ?moment$Moment,
  label?: string | void,
  minimumEthiopianYear: number,

  // triggered whenever a date selection changes. The date will be void if
  // the date selection is incomplete (e.g. if a year was selected, but not a
  // month)
  onDateChange: (moment$Moment | void) => void,
};

// Store ethiopian months 1-indexed since that is how toEthiopian will
// return them.
const MONTH_OPTIONS = ETHIOPIAN_MONTHS.map((month, idx) => (
  <Dropdown.Option key={`month_${idx + 1}`} value={idx + 1}>
    {month}
  </Dropdown.Option>
));

/**
 * This renders dropdowns to select ethiopian months and years.
 */
function EthiopianDateSelector({
  initialDate,
  minimumEthiopianYear,
  onDateChange,
  className = '',
  label = undefined,
}: Props): React.Node {
  const [year, setYear] = React.useState<number | void>(() =>
    initialDate ? dateToEthiopian(initialDate).year : undefined,
  );
  const [month, setMonth] = React.useState<number | void>(() =>
    initialDate ? dateToEthiopian(initialDate).month : undefined,
  );

  const onDateSelectionChange = React.useCallback(
    (m, yr) => {
      if (m !== undefined && yr !== undefined) {
        onDateChange(ethiopianToDate({ month: m, year: yr }));
      } else {
        onDateChange(undefined);
      }
    },
    [onDateChange],
  );

  const onMonthChange = React.useCallback(
    m => {
      setMonth(m);
      onDateSelectionChange(m, year);
    },
    [onDateSelectionChange, year],
  );

  const onYearChange = React.useCallback(
    yr => {
      setYear(yr);
      onDateSelectionChange(month, yr);
    },
    [onDateSelectionChange, month],
  );

  const yearOptions = React.useMemo(() => {
    const now = moment.utc();
    const [currentEthiopianYear] = toEthiopian(
      now.year(),
      now.month() + 1,
      now.date(),
    );

    return range(minimumEthiopianYear, currentEthiopianYear + 1)
      .reverse()
      .map(i => (
        <Dropdown.Option key={`year_${i}`} value={i}>
          {i}
        </Dropdown.Option>
      ));
  }, [minimumEthiopianYear]);

  return (
    <div
      aria-label={normalizeARIAName(label)}
      className={`zen-ethiopian-date-selector ${className}`}
      role="group"
    >
      {label !== undefined && (
        <div className="zen-ethiopian-date-selector__label u-info-text">
          {label}
        </div>
      )}
      <Dropdown
        ariaName={I18N.text('Ethiopian month selector')}
        buttonWidth={170}
        className="zen-ethiopian-date-selector__month-dropdown"
        defaultDisplayContent={I18N.textById('Month')}
        menuWidth="100%"
        onSelectionChange={onMonthChange}
        value={month}
      >
        {MONTH_OPTIONS}
      </Dropdown>
      <Dropdown
        ariaName={I18N.text('Ethiopian year selector')}
        buttonWidth={110}
        defaultDisplayContent={I18N.text('Year')}
        menuWidth="100%"
        onSelectionChange={onYearChange}
        value={year}
      >
        {yearOptions}
      </Dropdown>
    </div>
  );
}

export default (React.memo(
  EthiopianDateSelector,
): React.AbstractComponent<Props>);
