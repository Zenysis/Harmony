const TEXT = t('select_date');
const DATE_DISPLAY_NAME_LOOKUP = {
  CURRENT_CALENDAR_MONTH: TEXT.current_calendar_month,
  CURRENT_QUARTER: TEXT.current_quarter,
  PREVIOUS_CALENDAR_DAY: TEXT.previous_calendar_day,
  PREVIOUS_CALENDAR_WEEK: TEXT.previous_calendar_week,
  PREVIOUS_CALENDAR_MONTH: TEXT.previous_calendar_month,
  PREVIOUS_QUARTER: TEXT.previous_quarter,
  PREVIOUS_CALENDAR_YEAR: TEXT.previous_calendar_year,
  LAST_365_DAYS: TEXT.last_365_days,
  ALL_TIME: TEXT.all_time,
  FORECAST: TEXT.forecast,
  CUSTOM: TEXT.custom,
  CURRENT_FISCAL_QUARTER: TEXT.current_fiscal_quarter,
  CURRENT_FISCAL_YEAR: TEXT.current_fiscal_year,
  PREVIOUS_FISCAL_QUARTER: TEXT.previous_fiscal_quarter,
  PREVIOUS_FISCAL_YEAR: TEXT.previous_fiscal_year,

  ET_CHOOSE_MONTHS: t('query_form.select_date.ethiopian_months.label'),
};

// These lists are displayed in order.

// Only enable fiscal calendar filter options if the fiscal year does not start
// on January 1.
const ENABLE_FISCAL_OPTIONS = window.__JSON_FROM_BACKEND.fiscalStartMonth !== 1;

const CURRENT_CALENDAR_OPTIONS = ['CURRENT_CALENDAR_MONTH', 'CURRENT_QUARTER'];
const PREVIOUS_CALENDAR_OPTIONS = [
  'PREVIOUS_CALENDAR_DAY',
  'PREVIOUS_CALENDAR_WEEK',
  'PREVIOUS_CALENDAR_MONTH',
  'PREVIOUS_QUARTER',
  'PREVIOUS_CALENDAR_YEAR',
];
const CURRENT_FISCAL_OPTIONS = [
  'CURRENT_FISCAL_QUARTER',
  'CURRENT_FISCAL_YEAR',
];
const PREVIOUS_FISCAL_OPTIONS = [
  'PREVIOUS_FISCAL_QUARTER',
  'PREVIOUS_FISCAL_YEAR',
];

export const US_DATE_VALS = (() => {
  const output = ['CUSTOM'].concat(CURRENT_CALENDAR_OPTIONS);

  // NOTE(stephen): Slightly weird flow here so that fiscal options show up
  // in the right places.
  if (ENABLE_FISCAL_OPTIONS) {
    output.push(...CURRENT_FISCAL_OPTIONS);
  }
  output.push(...PREVIOUS_CALENDAR_OPTIONS);
  if (ENABLE_FISCAL_OPTIONS) {
    output.push(...PREVIOUS_FISCAL_OPTIONS);
  }

  return output.concat(['LAST_365_DAYS', 'ALL_TIME', 'FORECAST']);
})();

export const ET_DATE_VALS = ['ET_CHOOSE_MONTHS'];

export const getDateDisplayName = val => DATE_DISPLAY_NAME_LOOKUP[val];
