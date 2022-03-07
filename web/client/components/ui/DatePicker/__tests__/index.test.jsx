// @flow
import * as React from 'react';
import moment from 'moment';
import { render, screen, within } from '@testing-library/react';

import DatePicker from 'components/ui/DatePicker';
import { click, getEl, typeText } from 'testUtils/util';
import type {
  CalendarTypeConfig,
  DateConfiguration,
  DateGranularityConfig,
} from 'components/ui/DatePicker/types';
/**
 * Tests the DatePicker UI component. This file tests UI interactions. For a complete
 * verification of date range calculations, then look at the file that tests the
 * `computeDateRange` function.
 * TODO(pablo): test the `computeDateRange` function.
 */

const DEFAULT_MIN_DATE = moment('2000-01-01');
const DEFAULT_MAX_DATE = moment('2030-12-31');

const DEFAULT_ENABLED_CALENDAR_TYPES: Array<CalendarTypeConfig> = [
  { type: 'ETHIOPIAN', minimumEthiopianYear: 2005 },
  { type: 'GREGORIAN' },
];

const DEFAULT_ENABLED_DATE_GRANULARITIES: Array<DateGranularityConfig> = [
  { dateUnit: 'DAY' },
  { dateUnit: 'WEEK' },
  { dateUnit: 'MONTH' },
  { dateUnit: 'QUARTER' },
  { dateUnit: 'YEAR' },
  { dateUnit: 'FISCAL_QUARTER' },
  { dateUnit: 'FISCAL_YEAR' },
];

const DEFAULT_QUICK_OPTIONS: Array<DateConfiguration> = [
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
  {
    modifier: 'ALL_TIME',
  },
];

/**
 * Get the date modifier dropdown which has the 'This', 'Last', 'Since', and
 * 'Between' options.
 */
function getDateModifierDropdown(): HTMLElement {
  return getEl('button', 'select date modifier');
}

/**
 * Change the date modifier by selecting a new modifier from the dropdown.
 * @returns {HTMLElement} The date modifier dropdown
 */
function changeDateModifier(
  modifier: 'this' | 'last' | 'since' | 'between',
): HTMLElement {
  const dropdown = getDateModifierDropdown();
  click(dropdown);
  click('option', modifier);
  return dropdown;
}

/**
 * Get date from a SINCE configuration as a YYYY-MM-DD string.
 * If it's not a SINCE Configuration, or there is no date, then return an
 * empty string.
 */
function _getDateFromSinceConfiguration(
  dateConfig: DateConfiguration | void,
): string {
  if (dateConfig && dateConfig.modifier === 'SINCE') {
    return dateConfig.date ? dateConfig.date.format('YYYY-MM-DD') : '';
  }
  return '';
}

/**
 * Get date from a BETWEEN configuration as a [YYYY-MM-DD, YYYY-MM-DD] tuple
 * of strings.
 * If it's not a BETWEEN Configuration, or there are no dates, then return
 * empty strings.
 */
function _getDatesFromBetweenConfiguration(
  dateConfig: DateConfiguration | void,
): [string, string] {
  if (dateConfig && dateConfig.modifier === 'BETWEEN') {
    return [
      dateConfig.range.from ? dateConfig.range.from.format('YYYY-MM-DD') : '',
      dateConfig.range.to ? dateConfig.range.to.format('YYYY-MM-DD') : '',
    ];
  }
  return ['', ''];
}

function renderDefaultDatePicker(): { current: DateConfiguration | void } {
  const dateConfigurationRef = {
    current: undefined,
  };

  render(
    <DatePicker
      quickOptions={DEFAULT_QUICK_OPTIONS}
      defaultCalendarType="GREGORIAN"
      enabledDateGranularities={DEFAULT_ENABLED_DATE_GRANULARITIES}
      enabledCalendarTypes={DEFAULT_ENABLED_CALENDAR_TYPES}
      onApplyClick={dateConfig => {
        dateConfigurationRef.current = dateConfig;
      }}
      minAllTimeDate={DEFAULT_MIN_DATE}
      maxAllTimeDate={DEFAULT_MAX_DATE}
    />,
  );

  return dateConfigurationRef;
}

describe("DatePicker: 'This' and 'Last' date UIs", () => {
  test("Selecting 'This' and 'Last', using both the dropdown and quick options, with different granularities, updates the UI as expected", () => {
    // Test a bunch of different configurations of dropdown, quick option, and
    // granularities and make sure that the UI selects and highlights the
    // correct elements.
    // 1. Select 'This month' from quick option
    // 2. Change to 'Week' granularity.
    // 3. Change dropdown to 'Last'.
    //    'Custom date range' quick option should get highlighted
    // 4. Change to 'Year' granularity.
    //    'Last calendar year' quick option should get selected
    // 5. Select 'Last month' from quick options
    //    'Month' granularity should be selected.
    // 6. Switch back to 'This week'
    //    The dropdown should have updated baack to 'This'
    renderDefaultDatePicker();

    // 1. Select 'This month' quick option
    const thisMonthQuickOption = getEl('tab', /this month/i);
    expect(thisMonthQuickOption).toHaveAttribute('aria-selected', 'false');
    click(thisMonthQuickOption);
    expect(thisMonthQuickOption).toHaveAttribute('aria-selected', 'true');
    expect(getEl('radio', 'month')).toBeChecked();

    // 2. Change to 'Week' granularity
    const weekGranularityBtn = getEl('radio', 'week');
    click(weekGranularityBtn);
    expect(weekGranularityBtn).toBeChecked();

    // the 'This week' quick option should be selected now
    const thisWeekQuickOption = getEl('tab', /this week/i);
    expect(thisWeekQuickOption).toHaveAttribute('aria-selected', 'true');

    // 3. Change dropdown to 'Last'
    // 'Week' granularity should be selected, but we should now be on 'Custom
    // date range' quick option
    const dateModifierDropdown = changeDateModifier('last');
    expect(getEl('radio', 'week')).toBeChecked();
    expect(getEl('tab', /custom date range/i)).toHaveAttribute(
      'aria-selected',
      'true',
    );

    // 4. Change to 'Year' granularity. 'Last calendar year' quick option
    // should get selected.
    const yearGranularityBtn = getEl('radio', 'year');
    click(yearGranularityBtn);
    expect(yearGranularityBtn).toBeChecked();
    expect(getEl('tab', /last calendar year/i)).toHaveAttribute(
      'aria-selected',
      'true',
    );

    // 5. Change to 'Last month' quick option. This should select the
    // 'Month' granularity.
    const lastMonthQuickOption = getEl('tab', /last month/i);
    click(lastMonthQuickOption);
    expect(lastMonthQuickOption).toHaveAttribute('aria-selected', 'true');
    expect(getEl('radio', 'month'));

    // 6. Switch back to 'This week' quick option and the dropdown should
    // have updated back to 'This'
    // First, verify that it currently says 'Last'
    expect(dateModifierDropdown).toHaveTextContent('Last');

    // switch back to 'This week' quick option
    click(thisWeekQuickOption);
    expect(thisWeekQuickOption).toHaveAttribute('aria-selected', 'true');

    // now check that the dropdown changed to 'This'
    expect(dateModifierDropdown).toHaveTextContent('This');
  });

  test("Changing the number in the 'Last' date configuration works, and highlights a matching quick option if there is one", () => {
    // 1. select 'Last month'
    // 2. change number to 2 ('Custom date range' quick option should be highlighted)
    // 3. change number to 6 ('Last 6 months' quick option should be highlighted)
    // 4. Click 'Apply' and we should have the 'Last 6 Months' date configuration
    const appliedDateConfiguration = renderDefaultDatePicker();

    click('tab', /last month/i);
    const input = getEl('textbox', 'number of units');

    typeText(input, '2');

    const customDateRangeQuickOpt = getEl('tab', /custom date range/i);
    expect(customDateRangeQuickOpt).toHaveAttribute('aria-selected', 'true');

    typeText(input, '6');

    expect(customDateRangeQuickOpt).toHaveAttribute('aria-selected', 'false');
    expect(getEl('tab', /last 6 months/i)).toHaveAttribute(
      'aria-selected',
      'true',
    );

    click('button', /apply/i);

    expect(appliedDateConfiguration.current).toEqual({
      modifier: 'LAST',
      dateUnit: 'MONTH',
      numIntervals: 6,
      includeCurrentInterval: false,
    });
  });

  test("'Include current X' changes text for all granularities, and results in the correct configuration when Apply is clicked", () => {
    // 1. select 'Last month'
    // 2. Loop through all the granularities and verify that the `Include current X` text updates
    // 3. Click the checkbox (should be on the last granularity, 'Fiscal Year')
    // 4. Click 'Apply'
    // 5. Verify that the date configuration is correct
    const appliedDateConfiguration = renderDefaultDatePicker();

    // select 'last month'
    click('tab', /last month/i);

    const granularities = [
      'day',
      'week',
      'month',
      'quarter',
      'year',
      'fiscal quarter',
      'fiscal year',
    ];

    // loop over all granularities
    granularities.forEach(granularity => {
      click('radio', granularity);

      // verify the text is correct
      const label = screen.getByText(/include current/i);
      expect(label).toHaveTextContent(`Include current ${granularity} as well`);
    });

    // click the checkbox, and then Apply
    click('checkbox', /include current/i);
    click('button', /apply/i);

    expect(appliedDateConfiguration.current).toEqual({
      modifier: 'LAST',
      dateUnit: 'FISCAL_YEAR',
      numIntervals: 1,
      includeCurrentInterval: true,
    });
  });
});

describe('DatePicker: calendar picker interactions', () => {
  test("Selecting a 'Since' quick option shows the correct UI", () => {
    renderDefaultDatePicker();
    const sinceQuickOption = getEl('tab', /since my birthday/i);
    click(sinceQuickOption);
    expect(getEl('group', 'calendar date picker')).toBeInTheDocument();

    // verify that the 'Since...' quick option is highlighted
    expect(sinceQuickOption).toHaveAttribute('aria-selected', 'true');

    // verify the input text is 2020-02-25
    expect(getEl('textbox', 'enter date')).toHaveValue('February 25, 2020');
  });

  test("Selecting a 'Between' quick option shows the correct UI", () => {
    renderDefaultDatePicker();
    const betweenQuickOption = getEl('tab', /between holidays/i);
    click(betweenQuickOption);
    expect(getEl('group', 'calendar date range picker')).toBeInTheDocument();

    // verify that the 'Between...' quick option is highlighted
    expect(betweenQuickOption).toHaveAttribute('aria-selected', 'true');

    // verify the input texts are 2020-10-31 and 2020-12-25
    expect(getEl('textbox', 'enter start date')).toHaveValue(
      'October 31, 2020',
    );
    expect(getEl('textbox', 'enter end date')).toHaveValue('December 25, 2020');
  });

  test("Selecting 'All Time' quick option shows the calendar with correct start/end dates, and sets the modifier dropdown to 'Between'", () => {
    renderDefaultDatePicker();
    const allTimeQuickOption = getEl('tab', /all time/i);
    click(allTimeQuickOption);
    expect(getEl('group', 'calendar date range picker')).toBeInTheDocument();

    // verify that the 'All timequick option is highlighted
    expect(allTimeQuickOption).toHaveAttribute('aria-selected', 'true');

    // also verify that the dropdown says 'Between'
    expect(getDateModifierDropdown()).toHaveTextContent('Between');

    // verify the input texts are 2020-01-01 and 2030-12-31
    expect(getEl('textbox', 'enter start date')).toHaveValue('January 1, 2000');
    expect(getEl('textbox', 'enter end date')).toHaveValue('December 31, 2030');
  });

  test("Selecting 'Year to date' quick option shows the calendar with correct start/end dates, and sets the modifier dropdown to 'Between'", () => {
    renderDefaultDatePicker();
    const yearToDateQuickOption = getEl('tab', /year to date/i);
    click(yearToDateQuickOption);
    expect(getEl('group', 'calendar date range picker')).toBeInTheDocument();

    // verify that the 'Year to date' quick option is highlighted
    expect(yearToDateQuickOption).toHaveAttribute('aria-selected', 'true');

    // also verify that the dropdown says 'Between'
    expect(getDateModifierDropdown()).toHaveTextContent('Between');

    // verify the input texts show the correct Year To Date for this year
    const startOfYear = moment()
      .startOf('year')
      .format('MMMM D, YYYY');
    const today = moment().format('MMMM D, YYYY');
    expect(getEl('textbox', 'enter start date')).toHaveValue(startOfYear);
    expect(getEl('textbox', 'enter end date')).toHaveValue(today);
  });

  test("'Year to date' lookback years input is disabled while checkbox is unselected", () => {
    renderDefaultDatePicker();
    click('tab', /year to date/i);
    expect(
      getEl('checkbox', /get year to date of the same period/i),
    ).not.toBeChecked();
    expect(getEl('textbox', /number of years to look back/i)).toBeDisabled();
  });

  test("'Year to date' calendar shifts years as expected, but only when checkbox is selected", () => {
    renderDefaultDatePicker();
    click('tab', /year to date/i);
    click('checkbox', /get year to date of the same period/i);

    // verify the input texts show the correct Year To Date for the previous year
    const startOfLastYear = moment()
      .subtract(1, 'year')
      .startOf('year')
      .format('MMMM D, YYYY');
    const lastYearToday = moment()
      .subtract(1, 'year')
      .format('MMMM D, YYYY');
    expect(getEl('textbox', 'enter start date')).toHaveValue(startOfLastYear);
    expect(getEl('textbox', 'enter end date')).toHaveValue(lastYearToday);

    // change the number of lookback years
    const lookbackYears = 3;
    const lookbackInput = getEl('textbox', /number of years to look back/i);
    typeText(lookbackInput, String(lookbackYears));

    // verify the input texts for 3 years ago
    const startOfThreeYearsAgo = moment()
      .subtract(lookbackYears, 'year')
      .startOf('year')
      .format('MMMM D, YYYY');
    const threeYearsAgoToday = moment()
      .subtract(lookbackYears, 'year')
      .format('MMMM D, YYYY');
    expect(getEl('textbox', 'enter start date')).toHaveValue(
      startOfThreeYearsAgo,
    );
    expect(getEl('textbox', 'enter end date')).toHaveValue(threeYearsAgoToday);
  });

  test("Select 'Year to date', select the checkbox, then unselect it. We should alternate between 'Custom date range' aand 'Year to date' quick options.", () => {
    renderDefaultDatePicker();
    click('tab', /year to date/i);

    const checkbox = getEl('checkbox', /get year to date of the same period/i);
    click(checkbox);

    // verify 'Custom date range' is now selected
    expect(getEl('tab', /custom date range/i)).toHaveAttribute(
      'aria-selected',
      'true',
    );

    click(checkbox);

    // verify 'Year to date' is now selected
    expect(getEl('tab', /year to date/i)).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test("Changing calendar date in 'Year to date' mode switches to 'Custom date range', and the checkbox disappears", () => {
    renderDefaultDatePicker();
    click('tab', /year to date/i);

    const checkbox = getEl('checkbox', /get year to date of the same period/i);
    expect(checkbox).toBeInTheDocument();

    const startDateInput = getEl('textbox', 'enter start date');
    typeText(startDateInput, '10 jan 2000');

    // verify 'Custom date range' is now selected
    expect(getEl('tab', /custom date range/i)).toHaveAttribute(
      'aria-selected',
      'true',
    );

    // checkbox should have disappeared now
    expect(checkbox).not.toBeInTheDocument();
  });

  test("Selecting the 'Custom date range' quick option shows the calendar pickers, and sets the modifier dropdown to 'Between'", () => {
    // and verify that the 'All time...' quick option is highlighted
    renderDefaultDatePicker();
    const customQuickOption = getEl('tab', /custom date range/i);
    click(customQuickOption);
    expect(getEl('group', 'calendar date range picker')).toBeInTheDocument();
    expect(customQuickOption).toHaveAttribute('aria-selected', 'true');

    // also verify that the dropdown says 'Between'
    expect(getDateModifierDropdown()).toHaveTextContent('Between');

    // verify the input texts are persisted from the initial 'This week' selection
    const startOfWeek = moment().startOf('week');
    const endOfWeek = moment().endOf('week');
    expect(getEl('textbox', 'enter start date')).toHaveValue(
      startOfWeek.format('MMMM D, YYYY'),
    );
    expect(getEl('textbox', 'enter end date')).toHaveValue(
      endOfWeek.format('MMMM D, YYYY'),
    );
  });

  test("'Since' calendar date picker works with both text input and manual point-and-click", () => {
    const appliedDateConfiguration = renderDefaultDatePicker();
    // select 'Since' in the dropdown
    changeDateModifier('since');

    // change the input text
    const dateInput = getEl('textbox', 'enter date');
    typeText(dateInput, 'jan 20 2020');
    expect(dateInput).toHaveValue('January 20, 2020');

    // verify the calendar cell for that date is selected now
    expect(getEl('gridcell', 'Mon Jan 20 2020')).toHaveAttribute(
      'aria-selected',
      'true',
    );

    // click apply and verify the date updated correctly
    click('button', /apply/i);
    expect(
      _getDateFromSinceConfiguration(appliedDateConfiguration.current),
    ).toBe('2020-01-20');

    // click on a date in the calendar
    click('gridcell', 'Sat Jan 25 2020');

    // verify the text input updated to reflect the same date
    expect(dateInput).toHaveValue('January 25, 2020');

    // click Apply and check that the date updated correctly
    click('button', /apply/i);
    expect(
      _getDateFromSinceConfiguration(appliedDateConfiguration.current),
    ).toBe('2020-01-25');
  });

  test("'Since' calendar date picker works for Ethiopian date picker", () => {
    const appliedDateConfiguration = renderDefaultDatePicker();
    click('tab', /since/i);
    click('radio', 'ge’ez calendar');

    const monthDropdown = getEl('button', 'ethiopian month selector');
    const yearDropdown = getEl('button', 'ethiopian year selector');
    expect(monthDropdown).toHaveTextContent('Yekatit');
    expect(yearDropdown).toHaveTextContent('2012');

    // change the ethiopian dates
    click(monthDropdown);
    click('option', 'tikemet');
    click(yearDropdown);
    click('option', '2013');

    click('button', /apply/i);
    // verify that new gregorian date is 2020-10-11
    expect(
      _getDateFromSinceConfiguration(appliedDateConfiguration.current),
    ).toBe('2020-10-11');
  });

  test("'Between' calendar date picker works with both text input and manual point-and-click", () => {
    const appliedDateConfiguration = renderDefaultDatePicker();
    changeDateModifier('between');

    const startDateInput = getEl('textbox', 'enter start date');
    const endDateInput = getEl('textbox', 'enter end date');

    // type the start and end dates
    typeText(startDateInput, 'jan 5 2020');
    typeText(endDateInput, 'jan 28 2020');
    expect(startDateInput).toHaveValue('January 5, 2020');
    expect(endDateInput).toHaveValue('January 28, 2020');

    click('button', /apply/i);
    expect(
      _getDatesFromBetweenConfiguration(appliedDateConfiguration.current),
    ).toEqual(['2020-01-05', '2020-01-28']);

    // point-and-click end date
    click('gridcell', 'Thu Jan 30 2020');
    click('button', /apply/i);
    expect(endDateInput).toHaveValue('January 30, 2020');
    expect(
      _getDatesFromBetweenConfiguration(appliedDateConfiguration.current),
    ).toEqual(['2020-01-05', '2020-01-30']);

    // point-and-click new start date, but first go back two months
    click('button', 'Previous Month');
    click('button', 'Previous Month');
    click('gridcell', 'Tue Nov 12 2019');
    click('button', /apply/i);

    expect(startDateInput).toHaveValue('November 12, 2019');
    expect(endDateInput).toHaveValue('January 30, 2020'); // no change
    expect(
      _getDatesFromBetweenConfiguration(appliedDateConfiguration.current),
    ).toEqual(['2019-11-12', '2020-01-30']);
  });

  test("'Between' calendar date picker works for Ethiopian date picker", () => {
    const appliedDateConfiguration = renderDefaultDatePicker();
    changeDateModifier('between');
    click('radio', 'ge’ez calendar');

    // get all the ET date dropdowns
    const startDateEltContext = within(getEl('group', 'start date'));
    const endDateEltContext = within(getEl('group', 'end date'));
    const startMonthDropdown = startDateEltContext.getByRole('button', {
      name: 'ethiopian month selector',
    });
    const startYearDropdown = startDateEltContext.getByRole('button', {
      name: 'ethiopian year selector',
    });
    const endMonthDropdown = endDateEltContext.getByRole('button', {
      name: 'ethiopian month selector',
    });
    const endYearDropdown = endDateEltContext.getByRole('button', {
      name: 'ethiopian year selector',
    });

    // change the start and end dates
    click(startMonthDropdown);
    click('option', 'tahesas');
    click(startYearDropdown);
    click('option', '2012');

    click(endMonthDropdown);
    click('option', 'yekatit');
    click(endYearDropdown);
    click('option', '2013');

    click('button', /apply/i);

    expect(
      _getDatesFromBetweenConfiguration(appliedDateConfiguration.current),
    ).toEqual(['2019-12-11', '2021-02-08']);
  });

  test('Date entry works with all expected date formats when manually typed', () => {
    const datesToType = [
      // 'YYYY-M-D',
      { input: '2020-01-01', output: 'January 1, 2020' },
      // 'MMM D YYYY',
      { input: 'Jan 2 2020', output: 'January 2, 2020' },
      // 'MMMM D YYYY',
      { input: 'January 3 2020', output: 'January 3, 2020' },
      // 'MMM D, YYYY',
      { input: 'Jan 4, 2020', output: 'January 4, 2020' },
      // 'MMMM D, YYYY',
      { input: 'January 5, 2020', output: 'January 5, 2020' },
      // 'D MMM YYYY',
      { input: '6 Jan 2020', output: 'January 6, 2020' },
      // 'D MMMM YYYY',
      { input: '7 January 2020', output: 'January 7, 2020' },
      // 'D MMM, YYYY',
      { input: '8 Jan, 2020', output: 'January 8, 2020' },
      // 'D MMMM, YYYY',
      { input: '9 January, 2020', output: 'January 9, 2020' },
      // 'D/M/YYYY',
      { input: '9/1/2020', output: 'January 9, 2020' },
      // 'M/D/YYYY',
      { input: '1/20/2020', output: 'January 20, 2020' },
      // '[q]Q YYYY',
      { input: 'q2 2020', output: 'April 1, 2020' },
      // '[Q]Q YYYY',
      { input: 'Q3 2020', output: 'July 1, 2020' },
    ];

    renderDefaultDatePicker();
    changeDateModifier('since');
    const dateInput = getEl('textbox', 'enter date');

    // iterate through all our test strings and check that the dates
    // are parsed correctly
    datesToType.forEach(date => {
      typeText(dateInput, date.input);
      expect(dateInput).toHaveValue(date.output);
    });
  });

  test("Calendar picker 'Reset' button clears the existing date selections", () => {
    renderDefaultDatePicker();
    changeDateModifier('between');
    click('button', /reset/i);
    expect(getEl('textbox', 'enter start date')).toHaveValue('');
    expect(getEl('textbox', 'enter end date')).toHaveValue('');
    expect(getEl('button', /apply/i)).toBeDisabled();
  });
});

describe('DatePicker: misc interactions', () => {
  test('Switching from This => Last => Between => Since persists information across changes', () => {
    // 1. Select 'This week'.
    // 2. Then switch to 'Last' date modifier, and 'week' granularity should
    //    be persisted.
    // 3. Then switch to 'Between' date modifier, and the previous week should
    //    be selected (and in the text inputs).
    // 4. Then switch to 'Since' date modifier, and the start of the previous week
    //    should be filled in
    renderDefaultDatePicker();

    // 1. Select 'This week'
    click('tab', /this week/i);

    // 2. Switch to 'Last' date modifier
    changeDateModifier('last');

    // verify that 'week' granularity is still selected
    expect(getEl('radio', 'week')).toBeChecked();

    // 3. Switch to 'Between' date modifier
    changeDateModifier('between');
    const startOfLastWeek = moment()
      .subtract(1, 'week')
      .startOf('week');
    const endOfWeek = startOfLastWeek.clone().endOf('week');
    const startOfWeekString = startOfLastWeek.format('MMMM D, YYYY');
    const startOfWeekCalendarCell = startOfLastWeek.format('ddd MMM DD YYYY');

    // verify text inputs are accurate
    expect(getEl('textbox', 'enter start date')).toHaveValue(startOfWeekString);
    expect(getEl('textbox', 'enter end date')).toHaveValue(
      endOfWeek.format('MMMM D, YYYY'),
    );

    // verify calendar selections are correct
    expect(getEl('gridcell', startOfWeekCalendarCell)).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(
      getEl('gridcell', endOfWeek.format('ddd MMM DD YYYY')),
    ).toHaveAttribute('aria-selected', 'true');

    // 4. Switch to 'Since'
    changeDateModifier('since');
    expect(getEl('textbox', 'enter date')).toHaveValue(startOfWeekString);
    expect(getEl('gridcell', startOfWeekCalendarCell)).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});
