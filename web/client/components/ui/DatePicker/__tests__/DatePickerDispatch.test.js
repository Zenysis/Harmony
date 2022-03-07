// @flow
import invariant from 'invariant';
import moment from 'moment';

import { datePickerReducer } from 'components/ui/DatePicker/DatePickerDispatch';
import type { DateConfiguration } from 'components/ui/DatePicker/types';

const MAX_DATE = moment('2030-12-31');
const MIN_DATE = moment('2000-01-01');

function formatMoment(date: moment$Moment | void): string {
  return date ? date.format('YYYY-MM-DD') : '';
}

/**
 * Convert a { from, to } tuple of Moment instances to a [start, end] tuple
 * of strings in YYYY-MM-DD format.
 */
function formatRange(tuple: {
  +from: moment$Moment | void,
  +to: moment$Moment | void,
}): [string, string] {
  const { from, to } = tuple;
  return [formatMoment(from), formatMoment(to)];
}

/**
 * This file tests the datePickerReducer
 */
const THIS_WEEK_CONFIG: DateConfiguration = {
  modifier: 'THIS',
  dateUnit: 'WEEK',
};

const LAST_MONTH_CONFIG: DateConfiguration = {
  modifier: 'LAST',
  dateUnit: 'MONTH',
  numIntervals: 1,
  includeCurrentInterval: false,
};

const ALL_TIME_CONFIG: DateConfiguration = {
  modifier: 'ALL_TIME',
};

const DEFAULT_CONTEXT = {
  enabledDateGranularities: [
    { dateUnit: 'DAY' },
    { dateUnit: 'WEEK' },
    { dateUnit: 'MONTH' },
    { dateUnit: 'QUARTER' },
    { dateUnit: 'YEAR' },
    { dateUnit: 'FISCAL_QUARTER' },
    { dateUnit: 'FISCAL_YEAR' },
  ],
  fiscalStartMonth: 1,
  quickOptions: [
    THIS_WEEK_CONFIG,
    {
      modifier: 'THIS',
      dateUnit: 'MONTH',
    },
    LAST_MONTH_CONFIG,
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
      date: moment('2020-02-25'),
      displayName: 'Since my birthday',
    },
    {
      modifier: 'BETWEEN',
      range: {
        from: moment('2020-10-31'),
        to: moment('2020-12-25'),
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
    ALL_TIME_CONFIG,
  ],
  defaultCalendarType: 'GREGORIAN',
  maxAllTimeDate: MAX_DATE,
  minAllTimeDate: MIN_DATE,
};

describe('DatePicker: reducer & dispatch', () => {
  test('QUICK_OPTION_CHANGE: Switch from THIS to LAST Quick Option', () => {
    const { currentDateConfig } = datePickerReducer(
      { currentDateConfig: THIS_WEEK_CONFIG },
      {
        type: 'QUICK_OPTION_CHANGE',
        currentQuickOption: THIS_WEEK_CONFIG,
        newQuickOption: LAST_MONTH_CONFIG,
        datePickerContext: DEFAULT_CONTEXT,
      },
    );

    expect(currentDateConfig).toEqual(LAST_MONTH_CONFIG);
  });

  test('QUICK_OPTION_CHANGE: switch to ALL_TIME Quick Option results ALL_TIME date config', () => {
    const { currentDateConfig } = datePickerReducer(
      { currentDateConfig: THIS_WEEK_CONFIG },
      {
        type: 'QUICK_OPTION_CHANGE',
        currentQuickOption: THIS_WEEK_CONFIG,
        newQuickOption: ALL_TIME_CONFIG,
        datePickerContext: DEFAULT_CONTEXT,
      },
    );
    expect(currentDateConfig).toEqual(ALL_TIME_CONFIG);
  });

  test('QUICK_OPTION_CHANGE: Switch to CUSTOM, but keep the computed dates', () => {
    const { currentDateConfig } = datePickerReducer(
      { currentDateConfig: THIS_WEEK_CONFIG },
      {
        type: 'QUICK_OPTION_CHANGE',
        currentQuickOption: THIS_WEEK_CONFIG,
        newQuickOption: 'CUSTOM',
        datePickerContext: DEFAULT_CONTEXT,
      },
    );

    invariant(
      currentDateConfig.modifier === 'BETWEEN',
      'Current date config modifier must be BETWEEN',
    );
    const { range, ...betweenDateConfig } = currentDateConfig;
    expect(betweenDateConfig).toEqual({
      modifier: 'BETWEEN',
      calendarType: 'GREGORIAN',
    });
    expect(formatRange(range)).toEqual(
      formatRange({
        from: moment().startOf('week'),
        to: moment().endOf('week'),
      }),
    );
  });

  test('DATE_TYPE_MODIFIER_CHANGE: Switch from THIS to LAST keeps the date granularity', () => {
    const { currentDateConfig } = datePickerReducer(
      { currentDateConfig: THIS_WEEK_CONFIG },
      {
        type: 'DATE_TYPE_MODIFIER_CHANGE',
        newDateTypeModifier: 'LAST',
        datePickerContext: DEFAULT_CONTEXT,
      },
    );

    expect(currentDateConfig).toEqual({
      modifier: 'LAST',
      dateUnit: 'WEEK',
      numIntervals: 1,
      includeCurrentInterval: false,
    });
  });

  test('DATE_TYPE_MODIFIER_CHANGE: Switch from THIS to BETWEEN keeps the date range', () => {
    const { currentDateConfig } = datePickerReducer(
      { currentDateConfig: THIS_WEEK_CONFIG },
      {
        type: 'DATE_TYPE_MODIFIER_CHANGE',
        newDateTypeModifier: 'BETWEEN',
        datePickerContext: DEFAULT_CONTEXT,
      },
    );
    invariant(
      currentDateConfig.modifier === 'BETWEEN',
      'Current date config modifier must be BETWEEN',
    );
    const { range, ...betweenDateConfig } = currentDateConfig;
    expect(betweenDateConfig).toEqual({
      modifier: 'BETWEEN',
      calendarType: 'GREGORIAN',
    });
    expect(formatRange(range)).toEqual(
      formatRange({
        from: moment().startOf('week'),
        to: moment().endOf('week'),
      }),
    );
  });

  test('DATE_TYPE_MODIFIER_CHANGE: Switch from THIS to SINCE takes the start date', () => {
    const { currentDateConfig } = datePickerReducer(
      { currentDateConfig: THIS_WEEK_CONFIG },
      {
        type: 'DATE_TYPE_MODIFIER_CHANGE',
        newDateTypeModifier: 'SINCE',
        datePickerContext: DEFAULT_CONTEXT,
      },
    );
    invariant(
      currentDateConfig.modifier === 'SINCE',
      'Current date config modifier must be SINCE',
    );
    const { date, ...sinceDateConfig } = currentDateConfig;
    expect(sinceDateConfig).toEqual({
      modifier: 'SINCE',
      calendarType: 'GREGORIAN',
    });
    expect(formatMoment(date)).toEqual(formatMoment(moment().startOf('week')));
  });

  test('DATE_TYPE_MODIFIER_CHANGE: Switch from LAST to THIS keeps the date granularity', () => {
    const { currentDateConfig } = datePickerReducer(
      { currentDateConfig: LAST_MONTH_CONFIG },
      {
        type: 'DATE_TYPE_MODIFIER_CHANGE',
        newDateTypeModifier: 'THIS',
        datePickerContext: DEFAULT_CONTEXT,
      },
    );

    expect(currentDateConfig).toEqual({
      modifier: 'THIS',
      dateUnit: 'MONTH',
    });
  });

  test('DATE_TYPE_MODIFIER_CHANGE: Switch from LAST to BETWEEN computes the correct date range', () => {
    const { currentDateConfig } = datePickerReducer(
      { currentDateConfig: LAST_MONTH_CONFIG },
      {
        type: 'DATE_TYPE_MODIFIER_CHANGE',
        newDateTypeModifier: 'BETWEEN',
        datePickerContext: DEFAULT_CONTEXT,
      },
    );
    const startOfLastMonth = moment()
      .subtract(1, 'month')
      .startOf('month');

    invariant(
      currentDateConfig.modifier === 'BETWEEN',
      'Current date config modifier must be BETWEEN',
    );
    const { range, ...betweenDateConfig } = currentDateConfig;
    expect(betweenDateConfig).toEqual({
      modifier: 'BETWEEN',
      calendarType: 'GREGORIAN',
    });
    expect(formatRange(range)).toEqual(
      formatRange({
        from: startOfLastMonth,
        to: moment()
          .subtract(1, 'month')
          .endOf('month'),
      }),
    );

    // now try again, but this time with `includeCurrentInterval` set to true
    const { currentDateConfig: dateConfig2 } = datePickerReducer(
      {
        currentDateConfig: {
          modifier: 'LAST',
          dateUnit: 'MONTH',
          numIntervals: 1,
          includeCurrentInterval: true,
        },
      },
      {
        type: 'DATE_TYPE_MODIFIER_CHANGE',
        newDateTypeModifier: 'BETWEEN',
        datePickerContext: DEFAULT_CONTEXT,
      },
    );

    invariant(
      dateConfig2.modifier === 'BETWEEN',
      'Current date config modifier must be BETWEEN',
    );
    expect(formatRange(dateConfig2.range)).toEqual(
      formatRange({
        from: startOfLastMonth,
        to: moment().endOf('month'),
      }),
    );
  });

  test('DATE_TYPE_MODIFIER_CHANGE: Switch from LAST to SINCE takes the correct start date', () => {
    const { currentDateConfig } = datePickerReducer(
      { currentDateConfig: LAST_MONTH_CONFIG },
      {
        type: 'DATE_TYPE_MODIFIER_CHANGE',
        newDateTypeModifier: 'SINCE',
        datePickerContext: DEFAULT_CONTEXT,
      },
    );
    const startOfLastMonth = moment()
      .subtract(1, 'month')
      .startOf('month');

    invariant(
      currentDateConfig.modifier === 'SINCE',
      'Current date config modifier must be SINCE',
    );
    const { date, ...sinceDateConfig } = currentDateConfig;
    expect(sinceDateConfig).toEqual({
      modifier: 'SINCE',
      calendarType: 'GREGORIAN',
    });
    expect(formatMoment(date)).toEqual(formatMoment(startOfLastMonth));

    // now try again, but this time with `includeCurrentInterval` set to true
    const { currentDateConfig: dateConfig2 } = datePickerReducer(
      {
        currentDateConfig: {
          modifier: 'LAST',
          dateUnit: 'MONTH',
          numIntervals: 1,
          includeCurrentInterval: true,
        },
      },
      {
        type: 'DATE_TYPE_MODIFIER_CHANGE',
        newDateTypeModifier: 'SINCE',
        datePickerContext: DEFAULT_CONTEXT,
      },
    );

    invariant(
      dateConfig2.modifier === 'SINCE',
      'Current date config modifier must be SINCE',
    );
    expect(formatMoment(dateConfig2.date)).toEqual(
      formatMoment(startOfLastMonth),
    );
  });

  test('DATE_TYPE_MODIFIER_CHANGE: Switch from BETWEEN to SINCE takes the correct start date', () => {
    const startDate = moment('2020-01-01');
    const { currentDateConfig } = datePickerReducer(
      {
        currentDateConfig: {
          modifier: 'BETWEEN',
          range: {
            from: startDate,
            to: moment('2021-01-01'),
          },
        },
      },
      {
        type: 'DATE_TYPE_MODIFIER_CHANGE',
        newDateTypeModifier: 'SINCE',
        datePickerContext: DEFAULT_CONTEXT,
      },
    );

    invariant(
      currentDateConfig.modifier === 'SINCE',
      'Current date config modifier must be SINCE',
    );
    const { date, ...sinceDateConfig } = currentDateConfig;
    expect(sinceDateConfig).toEqual({
      modifier: 'SINCE',
      calendarType: 'GREGORIAN',
    });
    expect(formatMoment(currentDateConfig.date)).toEqual(
      formatMoment(startDate),
    );
  });

  test('DATE_TYPE_MODIFIER_CHANGE: Switch from SINCE to BETWEEN takes the correct start date, and goes until today', () => {
    const startDate = moment('2020-01-01');
    const { currentDateConfig } = datePickerReducer(
      {
        currentDateConfig: {
          modifier: 'SINCE',
          date: startDate,
        },
      },
      {
        type: 'DATE_TYPE_MODIFIER_CHANGE',
        newDateTypeModifier: 'BETWEEN',
        datePickerContext: DEFAULT_CONTEXT,
      },
    );

    invariant(
      currentDateConfig.modifier === 'BETWEEN',
      'Current date config modifier must be BETWEEN',
    );
    const { range, ...betweenDateConfig } = currentDateConfig;
    expect(betweenDateConfig).toEqual({
      modifier: 'BETWEEN',
      calendarType: 'GREGORIAN',
    });
    expect(formatRange(currentDateConfig.range)).toEqual(
      formatRange({
        from: startDate,
        to: moment(),
      }),
    );
  });

  test('DATE_UNIT_CHANGE: Switching date unit keeps the date modifier for THIS and LAST', () => {
    // test a LAST modifier
    const { currentDateConfig } = datePickerReducer(
      {
        currentDateConfig: LAST_MONTH_CONFIG,
      },
      {
        type: 'DATE_UNIT_CHANGE',
        newDateUnit: 'WEEK',
      },
    );

    expect(currentDateConfig).toEqual({
      modifier: 'LAST',
      numIntervals: 1,
      includeCurrentInterval: false,
      dateUnit: 'WEEK',
    });

    // test a THIS modifier
    const { currentDateConfig: dateConfig2 } = datePickerReducer(
      {
        currentDateConfig: THIS_WEEK_CONFIG,
      },
      {
        type: 'DATE_UNIT_CHANGE',
        newDateUnit: 'MONTH',
      },
    );

    expect(dateConfig2).toEqual({
      modifier: 'THIS',
      dateUnit: 'MONTH',
    });
  });

  test('DATE_NUM_INTERVALS_CHANGE: Change num intervals keeps the LAST config as is, only changes the interval number', () => {
    const { currentDateConfig } = datePickerReducer(
      { currentDateConfig: LAST_MONTH_CONFIG },
      {
        type: 'DATE_NUM_INTERVALS_CHANGE',
        numIntervals: 6,
      },
    );

    expect(currentDateConfig).toEqual({
      modifier: 'LAST',
      dateUnit: 'MONTH',
      includeCurrentInterval: false,
      numIntervals: 6,
    });
  });

  test('INCLUDE_CURRENT_INTERVAL_CHANGE: changing includeCurrentInterval flag keeps the LAST config as is, only changes the flag', () => {
    const { currentDateConfig } = datePickerReducer(
      { currentDateConfig: LAST_MONTH_CONFIG },
      {
        type: 'INCLUDE_CURRENT_INTERVAL_CHANGE',
        shouldInclude: true,
      },
    );

    expect(currentDateConfig).toEqual({
      modifier: 'LAST',
      dateUnit: 'MONTH',
      includeCurrentInterval: true,
      numIntervals: 1,
    });
  });

  test("DATE_RANGE_CHANGE: updates the BETWEEN config's date range", () => {
    const newStartDate = moment('2020-12-01');
    const newEndDate = moment('2021-03-01');
    const { currentDateConfig } = datePickerReducer(
      {
        currentDateConfig: {
          modifier: 'BETWEEN',
          calendarType: 'GREGORIAN',
          range: {
            from: moment('2000-01-01'),
            to: moment('2001-01-01'),
          },
        },
      },
      {
        type: 'DATE_RANGE_CHANGE',
        dateRange: {
          from: newStartDate,
          to: newEndDate,
        },
      },
    );

    expect(currentDateConfig).toEqual({
      modifier: 'BETWEEN',
      calendarType: 'GREGORIAN',
      range: {
        from: newStartDate,
        to: newEndDate,
      },
    });
  });

  test("SINCE_DATE_CHANGE: updates the SINCE config's date", () => {
    const newStartDate = moment('2020-12-01');
    const { currentDateConfig } = datePickerReducer(
      {
        currentDateConfig: {
          modifier: 'SINCE',
          calendarType: 'GREGORIAN',
          date: moment('2000-01-01'),
        },
      },
      {
        type: 'SINCE_DATE_CHANGE',
        date: newStartDate,
      },
    );

    expect(currentDateConfig).toEqual({
      modifier: 'SINCE',
      calendarType: 'GREGORIAN',
      date: newStartDate,
    });
  });

  test('CALENDAR_TYPE_CHANGE: updates calendar type, but keeps the rest of the config unchanged', () => {
    const startDate = moment('2020-12-01');
    const endDate = moment('2021-03-01');
    const range = {
      from: startDate,
      to: endDate,
    };

    // test the BETWEEN config
    expect(
      datePickerReducer(
        {
          currentDateConfig: {
            range,
            modifier: 'BETWEEN',
            calendarType: 'GREGORIAN',
          },
        },
        {
          type: 'CALENDAR_TYPE_CHANGE',
          newCalendarType: 'ETHIOPIAN',
        },
      ).currentDateConfig,
    ).toEqual({
      range,
      modifier: 'BETWEEN',
      calendarType: 'ETHIOPIAN',
    });

    // test the SINCE config
    expect(
      datePickerReducer(
        {
          currentDateConfig: {
            modifier: 'SINCE',
            calendarType: 'GREGORIAN',
            date: startDate,
          },
        },
        {
          type: 'CALENDAR_TYPE_CHANGE',
          newCalendarType: 'ETHIOPIAN',
        },
      ).currentDateConfig,
    ).toEqual({
      modifier: 'SINCE',
      calendarType: 'ETHIOPIAN',
      date: startDate,
    });

    // test the ALL_TIME config
    expect(
      datePickerReducer(
        {
          currentDateConfig: {
            modifier: 'ALL_TIME',
            calendarType: 'GREGORIAN',
          },
        },
        {
          type: 'CALENDAR_TYPE_CHANGE',
          newCalendarType: 'ETHIOPIAN',
        },
      ).currentDateConfig,
    ).toEqual({
      modifier: 'ALL_TIME',
      calendarType: 'ETHIOPIAN',
    });

    // test the YEAR_TO_DATE config
    expect(
      datePickerReducer(
        {
          currentDateConfig: {
            modifier: 'YEAR_TO_DATE',
            calendarType: 'GREGORIAN',
            usePreviousYear: true,
            numYearsLookback: 1,
          },
        },
        {
          type: 'CALENDAR_TYPE_CHANGE',
          newCalendarType: 'ETHIOPIAN',
        },
      ).currentDateConfig,
    ).toEqual({
      modifier: 'YEAR_TO_DATE',
      calendarType: 'ETHIOPIAN',
      usePreviousYear: true,
      numYearsLookback: 1,
    });
  });

  test('YEAR_TO_DATE_USE_PREVIOUS_YEAR_CHANGE: the usePreviousYear boolean updates correctly', () => {
    expect(
      datePickerReducer(
        {
          currentDateConfig: {
            modifier: 'YEAR_TO_DATE',
            usePreviousYear: false,
            numYearsLookback: 1,
          },
        },
        {
          type: 'YEAR_TO_DATE_USE_PREVIOUS_YEAR_CHANGE',
          usePreviousYear: true,
        },
      ).currentDateConfig,
    ).toEqual({
      modifier: 'YEAR_TO_DATE',
      usePreviousYear: true,
      numYearsLookback: 1,
    });
  });

  test('YEAR_TO_DATE_YEARS_LOOKBACK_CHANGE: the numYearsLookback number updates correctly', () => {
    expect(
      datePickerReducer(
        {
          currentDateConfig: {
            modifier: 'YEAR_TO_DATE',
            usePreviousYear: true,
            numYearsLookback: 1,
          },
        },
        {
          type: 'YEAR_TO_DATE_YEARS_LOOKBACK_CHANGE',
          numYearsLookback: 3,
        },
      ).currentDateConfig,
    ).toEqual({
      modifier: 'YEAR_TO_DATE',
      usePreviousYear: true,
      numYearsLookback: 3,
    });
  });
});
