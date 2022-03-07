// @flow
import moment from 'moment';

import computeDateRange from 'components/ui/DatePicker/computeDateRange';

const DATE_FORMAT = 'YYYY-MM-DD';

function formatMoment(date: moment$Moment): string {
  return date.format(DATE_FORMAT);
}

/**
 * Convert a { from, to } tuple of Moment instances to a [start, end] tuple
 * of strings in YYYY-MM-DD format.
 */
function formatRange(tuple: {
  from: moment$Moment,
  to: moment$Moment,
}): [string, string] {
  const { from, to } = tuple;
  return [formatMoment(from), formatMoment(to)];
}

function getCurrentFiscalQuarterRange(
  fiscalStartMonth: number,
): { from: moment$Moment, to: moment$Moment } {
  const fiscalOffset = fiscalStartMonth - 1;
  const start = moment()
    .subtract(fiscalOffset, 'month')
    .startOf('quarter')
    .add(fiscalOffset, 'month');
  const end = start
    .clone()
    .add(1, 'quarter')
    .subtract(1, 'day');
  return { from: start, to: end };
}

function getCurrentFiscalHalfRange(
  fiscalStartMonth: number,
): { from: moment$Moment, to: moment$Moment } {
  const fiscalOffset = fiscalStartMonth - 1;
  const quarterStart = moment()
    .subtract(fiscalOffset, 'month')
    .startOf('quarter');
  const start =
    quarterStart.quarter() % 2 === 1
      ? quarterStart.add(fiscalOffset, 'month')
      : quarterStart
          .subtract(1, 'quarter')
          .startOf('quarter')
          .add(fiscalOffset, 'month');

  const end = start
    .clone()
    .add(2, 'quarter')
    .subtract(1, 'day');
  return { from: start, to: end };
}

function getCurrentFiscalYearRange(
  fiscalStartMonth: number,
): { from: moment$Moment, to: moment$Moment } {
  const fiscalOffset = fiscalStartMonth - 1;
  const start = moment()
    .subtract(fiscalOffset, 'month')
    .startOf('year')
    .add(fiscalOffset, 'month');
  const end = start
    .clone()
    .add(1, 'year')
    .subtract(1, 'day');
  return { from: start, to: end };
}

/**
 * This file tests the `computeDateRange` utility function to ensure that the
 * DatePicker's DateConfiguration objects are parsed to date ranges correctly.
 */
describe('DatePicker: computeDateRange utility', () => {
  test("Compute 'THIS' day, week, month, quarter, and year", () => {
    ['DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR'].forEach(dateUnit => {
      const dateRange = computeDateRange({ dateUnit, modifier: 'THIS' });
      expect(formatRange(dateRange)).toEqual([
        formatMoment(moment().startOf(dateUnit)),
        formatMoment(moment().endOf(dateUnit)),
      ]);
    });
  });

  test("Compute 'THIS' fiscal quarter, fiscal half, and fiscal year", () => {
    const fiscalStartMonth = 6;
    let dateRange = computeDateRange(
      { dateUnit: 'FISCAL_QUARTER', modifier: 'THIS' },
      { fiscalStartMonth },
    );

    expect(formatRange(dateRange)).toEqual(
      formatRange(getCurrentFiscalQuarterRange(fiscalStartMonth)),
    );

    dateRange = computeDateRange(
      { dateUnit: 'FISCAL_HALF', modifier: 'THIS' },
      { fiscalStartMonth },
    );

    expect(formatRange(dateRange)).toEqual(
      formatRange(getCurrentFiscalHalfRange(fiscalStartMonth)),
    );

    dateRange = computeDateRange(
      { dateUnit: 'FISCAL_YEAR', modifier: 'THIS' },
      { fiscalStartMonth },
    );

    expect(formatRange(dateRange)).toEqual(
      formatRange(getCurrentFiscalYearRange(fiscalStartMonth)),
    );
  });

  test("Compute 'LAST' day, week, month, quarter, and year. Also compute with 'includeCurrentInterval' flag", () => {
    ['DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR'].forEach(dateUnit => {
      const numIntervals = 2;

      let dateRange = computeDateRange({
        dateUnit,
        numIntervals,
        modifier: 'LAST',
        includeCurrentInterval: false,
      });

      const startDate = moment()
        .subtract(numIntervals, dateUnit)
        .startOf(dateUnit);
      const endDate = moment()
        .subtract(1, dateUnit)
        .endOf(dateUnit);

      expect(formatRange(dateRange)).toEqual([
        formatMoment(startDate),
        formatMoment(endDate),
      ]);

      dateRange = computeDateRange({
        dateUnit,
        numIntervals,
        modifier: 'LAST',
        includeCurrentInterval: true,
      });

      expect(formatRange(dateRange)).toEqual([
        formatMoment(startDate),
        formatMoment(
          endDate
            .clone()
            .add(1, dateUnit)
            .endOf(dateUnit),
        ),
      ]);
    });
  });

  test("Compute 'LAST' fiscal quarter, fiscal half, and fiscal year. Also compute with 'includeCurrentInterval flag", () => {
    const fiscalStartMonth = 6;

    // test FISCAL_QUARTER
    let dateConfig = {
      dateUnit: 'FISCAL_QUARTER',
      modifier: 'LAST',
      numIntervals: 2,
      includeCurrentInterval: false,
    };
    let dateRange = computeDateRange(dateConfig, { fiscalStartMonth });

    const currentQuarter = getCurrentFiscalQuarterRange(fiscalStartMonth);
    const newQuarterStart = currentQuarter.from.clone().subtract(2, 'quarter');
    expect(formatRange(dateRange)).toEqual(
      formatRange({
        from: newQuarterStart,
        to: currentQuarter.to
          .clone()
          .subtract(1, 'quarter')
          .endOf('month'),
      }),
    );

    dateRange = computeDateRange(
      { ...dateConfig, includeCurrentInterval: true },
      { fiscalStartMonth },
    );
    expect(formatRange(dateRange)).toEqual(
      formatRange({
        from: newQuarterStart,
        to: currentQuarter.to,
      }),
    );

    // test FISCAL_HALF
    dateConfig = {
      dateUnit: 'FISCAL_HALF',
      modifier: 'LAST',
      numIntervals: 2,
      includeCurrentInterval: false,
    };
    dateRange = computeDateRange(dateConfig, { fiscalStartMonth });

    const currentHalf = getCurrentFiscalHalfRange(fiscalStartMonth);
    const newHalfStart = currentHalf.from.clone().subtract(4, 'quarter');
    expect(formatRange(dateRange)).toEqual(
      formatRange({
        from: newHalfStart,
        to: currentHalf.to
          .clone()
          .subtract(2, 'quarter')
          .endOf('month'),
      }),
    );

    dateRange = computeDateRange(
      { ...dateConfig, includeCurrentInterval: true },
      { fiscalStartMonth },
    );

    expect(formatRange(dateRange)).toEqual(
      formatRange({
        from: newHalfStart,
        to: currentHalf.to,
      }),
    );

    // test FISCAL_YEAR
    dateConfig = {
      dateUnit: 'FISCAL_YEAR',
      modifier: 'LAST',
      numIntervals: 2,
      includeCurrentInterval: false,
    };
    dateRange = computeDateRange(dateConfig, { fiscalStartMonth });

    const currentYear = getCurrentFiscalYearRange(fiscalStartMonth);
    const newYearStart = currentYear.from.subtract(2, 'year');

    expect(formatRange(dateRange)).toEqual(
      formatRange({
        from: newYearStart,
        to: currentYear.to
          .clone()
          .subtract(1, 'year')
          .endOf('month'),
      }),
    );

    dateRange = computeDateRange(
      { ...dateConfig, includeCurrentInterval: true },
      { fiscalStartMonth },
    );

    expect(formatRange(dateRange)).toEqual(
      formatRange({
        from: newYearStart,
        to: currentYear.to,
      }),
    );
  });

  test('Get date range from ALL_TIME date configuration', () => {
    const dateRange = computeDateRange(
      {
        modifier: 'ALL_TIME',
        calendarType: 'GREGORIAN',
      },
      {
        minAllTimeDate: moment('2000-01-01'),
        maxAllTimeDate: moment('2030-12-31'),
      },
    );

    expect(formatRange(dateRange)).toEqual(['2000-01-01', '2030-12-31']);
  });

  test('Get date range from BETWEEN date configuration', () => {
    const dateRange = computeDateRange({
      modifier: 'BETWEEN',
      calendarType: 'GREGORIAN',
      range: {
        from: moment('2000-01-01'),
        to: moment('2020-01-01'),
      },
    });

    expect(formatRange(dateRange)).toEqual(['2000-01-01', '2020-01-01']);
  });

  test('Get date range from SINCE date configuration', () => {
    const dateRange = computeDateRange({
      modifier: 'SINCE',
      calendarType: 'GREGORIAN',
      date: moment('2000-01-01'),
    });

    expect(formatRange(dateRange)).toEqual([
      '2000-01-01',
      moment().format('YYYY-MM-DD'),
    ]);
  });

  test('Compute basic YEAR_TO_DATE without any configurations', () => {
    const dateRange = computeDateRange({
      modifier: 'YEAR_TO_DATE',
      calendarType: 'GREGORIAN',
      usePreviousYear: false,
      numYearsLookback: 0,
    });

    expect(formatRange(dateRange)).toEqual([
      moment()
        .startOf('year')
        .format('YYYY-MM-DD'),
      moment().format('YYYY-MM-DD'),
    ]);
  });

  test('Compute basic YEAR_TO_DATE with numYearsLookback set, but usePreviousYear set to false. So it still calculates this year', () => {
    const dateRange = computeDateRange({
      modifier: 'YEAR_TO_DATE',
      calendarType: 'GREGORIAN',
      usePreviousYear: false,
      numYearsLookback: 3,
    });

    expect(formatRange(dateRange)).toEqual([
      moment()
        .startOf('year')
        .format('YYYY-MM-DD'),
      moment().format('YYYY-MM-DD'),
    ]);
  });

  test('Compute YEAR_TO_DATE with numYearsLookback and usePreviousYear set, so we should look back in time', () => {
    const dateRange = computeDateRange({
      modifier: 'YEAR_TO_DATE',
      calendarType: 'GREGORIAN',
      usePreviousYear: true,
      numYearsLookback: 3,
    });

    expect(formatRange(dateRange)).toEqual([
      moment()
        .startOf('year')
        .subtract(3, 'year')
        .format('YYYY-MM-DD'),
      moment()
        .subtract(3, 'year')
        .format('YYYY-MM-DD'),
    ]);
  });
});
