```jsx
import Group from 'components/ui/Group';
import computeDateRange from 'components/ui/DatePicker/computeDateRange';
import Moment from 'models/core/wip/DateTime/Moment';

const [dateModifier, setDateModifier] = React.useState(undefined);
const [dateRange, setDateRange] = React.useState(undefined);

const enabledCalendarTypes = [
  { type: 'ETHIOPIAN', minimumEthiopianYear: 2005 },
  { type: 'GREGORIAN' },
];

const enabledDateGranularities = [
  { dateUnit: 'DAY' },
  { dateUnit: 'WEEK' },
  { dateUnit: 'MONTH' },
  { dateUnit: 'QUARTER' },
  { dateUnit: 'YEAR' },
  { dateUnit: 'FISCAL_QUARTER' },
  { dateUnit: 'FISCAL_YEAR' },
];

const defaultQuickOptions = [
  {
    modifier: 'THIS',
    dateUnit: 'WEEK',
  },
  {
    modifier: 'THIS',
    dateUnit: 'MONTH',
  },
  {
    modifier: 'LAST',
    dateUnit: 'MONTH',
    numIntervals: 1,
    includeCurrentInterval: false,
  },
  {
    modifier: 'LAST',
    dateUnit: 'MONTH',
    numIntervals: 6,
    includeCurrentInterval: false,
  },
  {
    modifier: 'THIS',
    dateUnit: 'YEAR',
  },
  {
    modifier: 'SINCE',
    date: Moment.create('2020-02-25').momentView(),
    displayName: 'Since my birthday',
  },
  {
    modifier: 'BETWEEN',
    range: {
      from: Moment.create('2020-10-31').momentView(),
      to: Moment.create('2020-12-25').momentView(),
    },
    displayName: 'Between holidays',
  },
  {
    modifier: 'LAST',
    dateUnit: 'YEAR',
    numIntervals: 1,
    includeCurrentInterval: false,
  },
  {
    modifier: 'YEAR_TO_DATE',
    usePreviousYear: false,
    numYearsLookback: 1,
  },
  {
    modifier: 'ALL_TIME',
  },
];

const MIN_DATE = Moment.create('2000-01-01').momentView();
const MAX_DATE = Moment.create().momentView();

function onApplyClick(dateConfig) {
  setDateModifier(dateConfig.modifier);
  setDateRange(
    computeDateRange(
      dateConfig,
      { minAllTimeDate: MIN_DATE, maxAllTimeDate: MAX_DATE },
    ),
  );
}

function dateRangeToString(range) {
  if (range === undefined) {
    return 'None selected';
  }
  const { from, to } = range;
  return `${Moment.create(from).format('YYYY-MM-DD')} to ${Moment.create(to).format('YYYY-MM-DD')}`;
}

<Group.Vertical>
  <p>
    Date modifier: {dateModifier || 'None selected'}
  </p>
  <p>
    Date range: {dateRangeToString(dateRange)}
  </p>

  <DatePicker
    quickOptions={defaultQuickOptions}
    defaultCalendarType="GREGORIAN"
    enabledDateGranularities={enabledDateGranularities}
    enabledCalendarTypes={enabledCalendarTypes}
    onApplyClick={onApplyClick}
    minAllTimeDate={MIN_DATE}
    maxAllTimeDate={MAX_DATE}
  />
</Group.Vertical>
```
