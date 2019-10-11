// @noflow
import moment from 'moment';

const TEXT = t('visualizations.common.SettingsModal.GeneralSettingsTab');

export const BUCKET_LABELS = {
  NONE: TEXT.None,
  DAY: TEXT.Day,
  WEEK: TEXT.Week,
  MONTH: TEXT.Month,
  QUARTER: TEXT.Quarter,
  HALF_YEAR: TEXT.Halfyear,
  YEAR: TEXT.Year,
  FISCAL_QUARTER: TEXT.FiscalQuarter,
  FISCAL_YEAR: TEXT.FiscalYear,
};

export const BUCKET_TYPE = {
  NONE: 'NONE',
  DAY: 'DAY',
  WEEK: 'WEEK',
  MONTH: 'MONTH',
  QUARTER: 'QUARTER',
  HALF_YEAR: 'HALF_YEAR',
  YEAR: 'YEAR',
  FISCAL_QUARTER: 'FISCAL_QUARTER',
  FISCAL_YEAR: 'FISCAL_YEAR',
};

// Granularity names that the backend expects.
// TODO(stephen): Just consolidate this with BUCKET_TYPE so that it
// doesn't need to be defined twice. This might require a rewrite of saved
// dashboards.
// TODO(stephen): THIS SHOULD LIVE SOMEWHERE ELSE.
export const BACKEND_GRANULARITIES = {
  ALL: 'all',
  [BUCKET_TYPE.DAY]: 'day',
  [BUCKET_TYPE.WEEK]: 'week',
  [BUCKET_TYPE.MONTH]: 'month',
  [BUCKET_TYPE.QUARTER]: 'quarter',
  [BUCKET_TYPE.YEAR]: 'year',
  [BUCKET_TYPE.FISCAL_QUARTER]: 'fiscal_quarter',
  [BUCKET_TYPE.FISCAL_YEAR]: 'fiscal_year',
};

export function getBucketForDate(dateInput, bucketType) {
  // For a given date, return a string that this data is bucketed with.
  // Any values with a matching string will be summed.
  const d = moment.utc(dateInput);
  let rounded = d;
  switch (bucketType) {
    case BUCKET_TYPE.WEEK:
      rounded = d.startOf('week');
      break;
    case BUCKET_TYPE.MONTH:
      rounded = d.startOf('month');
      break;
    case BUCKET_TYPE.QUARTER:
      rounded = d.startOf('quarter');
      break;
    case BUCKET_TYPE.HALF_YEAR: {
      const month = Math.floor(d.month() / 6) * 6;
      rounded = d.set('month', month).startOf('month');
      break;
    }
    case BUCKET_TYPE.YEAR:
      rounded = d.startOf('year');
      break;
    default:
      break;
  }
  // Return standard ISO string so that values can be
  // sorted
  return rounded.toISOString();
}

export function hasForecastTimeSeries(fieldIds, fieldId) {
  const forecastIndicator = `forecast_${fieldId}`;
  return fieldIds.includes(forecastIndicator);
}

export function getForecastFieldId(fieldId) {
  return `forecast_${fieldId}`;
}

export function buildPlotlyDateLabels(
  labels: $ReadOnlyArray<string>,
  padLeft: boolean = false,
): $ReadOnlyArray<string> {
  // HACK(stephen): Since our pretty date labels are not always unique
  // (i.e. Jan showing up twice in the result), plotly will act really weird
  // and draw an invalid graph. One way to fix this is to tell plotly the
  // x-axis labels we want shown, however this forces us to build a lot more
  // features (like determining how many labels should be shown) that we
  // don't want to do. To avoid this, we supply plotly with a version of our
  // pretty date labels with every value being unique. To ensure that values
  // are unique, we add a variable amount of spaces at the end of the label.
  // When plotly processes these values, it will consider them unique.
  // However, when it draws the x-axis, it will strip the trailing spaces and
  // we will have our pretty labels in the output.
  const counts = {};
  return labels.map(label => {
    const labelCount = counts[label] || 0;
    counts[label] = labelCount + 1;
    const padding = ' '.repeat(labelCount);
    if (padLeft) {
      return `${padding}${label}`;
    }
    return `${label}${padding}`;
  });
}
