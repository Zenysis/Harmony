const TEXT = t('select_date');

// HACK(stephen): The constants in this file have historically been defined
// synchronously, and they are populated when the page loads. Certain parts of
// the site (like the login page) *do not* receive the full backend settings
// object, so things like calendar settings are missing.
// TODO(stephen): This file is really ripe for a refactor, and I expect that
// will happen when a new date picker is developed. For now, I am ok accruing a
// bit more technical debt (like the fiscal calendar stuff).
const SERIALIZED_CALENDAR_SETTINGS = window.__JSON_FROM_BACKEND
  .calendarSettings || { fiscalStartMonth: 1, granularitySettings: {} };

const ENABLE_FISCAL_OPTIONS =
  SERIALIZED_CALENDAR_SETTINGS.fiscalStartMonth !== 1;

const DATE_DISPLAY_NAME_LOOKUP = {
  CURRENT_CALENDAR_MONTH: TEXT.current_calendar_month,
  CURRENT_QUARTER: TEXT.current_quarter,
  CURRENT_YEAR: TEXT.current_year,
  PREVIOUS_CALENDAR_DAY: TEXT.previous_calendar_day,
  PREVIOUS_CALENDAR_WEEK: TEXT.previous_calendar_week,
  PREVIOUS_CALENDAR_MONTH: TEXT.previous_calendar_month,
  PREVIOUS_QUARTER: TEXT.previous_quarter,
  PREVIOUS_CALENDAR_YEAR: TEXT.previous_calendar_year,
  LAST_365_DAYS: TEXT.last_365_days,
  ALL_TIME: TEXT.all_time,
  FORECAST: TEXT.forecast,
  CUSTOM: TEXT.custom,

  ET_CHOOSE_MONTHS: t('query_form.select_date.ethiopian_months.label'),
};

// These lists are displayed in order.

const CURRENT_CALENDAR_OPTIONS = [
  'CURRENT_CALENDAR_MONTH',
  'CURRENT_QUARTER',
  'CURRENT_YEAR',
];
const PREVIOUS_CALENDAR_OPTIONS = [
  'PREVIOUS_CALENDAR_DAY',
  'PREVIOUS_CALENDAR_WEEK',
  'PREVIOUS_CALENDAR_MONTH',
  'PREVIOUS_QUARTER',
  'PREVIOUS_CALENDAR_YEAR',
];

// Compute the fiscal calendar options based on the calendar settings provided
// by the backend for this deployment.
const [CURRENT_FISCAL_OPTIONS, PREVIOUS_FISCAL_OPTIONS] = (() => {
  if (!ENABLE_FISCAL_OPTIONS) {
    return [[], []];
  }

  const fiscalGranularityOrder = [
    { granularity: 'fiscalQuarter', lookupName: 'FISCAL_QUARTER' },
    { granularity: 'fiscalHalf', lookupName: 'FISCAL_HALF' },
    { granularity: 'fiscalYear', lookupName: 'FISCAL_YEAR' },
  ];

  const currentOptions = [];
  const previousOptions = [];
  fiscalGranularityOrder.forEach(({ granularity, lookupName }) => {
    const granularitySetting =
      SERIALIZED_CALENDAR_SETTINGS.granularitySettings[granularity];
    if (granularitySetting === undefined || !granularitySetting.enabled) {
      return;
    }

    // Add current and previous options separately and fill in their display
    // names dynamically based on the calendar settings.
    const currentOption = `CURRENT_${lookupName}`;
    const previousOption = `PREVIOUS_${lookupName}`;
    currentOptions.push(currentOption);
    previousOptions.push(previousOption);
    DATE_DISPLAY_NAME_LOOKUP[
      currentOption
    ] = t('select_date.currentFiscalPeriod', { name: granularitySetting.name });
    DATE_DISPLAY_NAME_LOOKUP[
      previousOption
    ] = t('select_date.previousFiscalPeriod', {
      name: granularitySetting.name,
    });
  });

  return [currentOptions, previousOptions];
})();

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
