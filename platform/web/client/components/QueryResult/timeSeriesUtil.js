// @flow
import moment from 'moment';

type BucketTypeMap = {
  DAY: 'DAY',
  FISCAL_QUARTER: 'FISCAL_QUARTER',
  FISCAL_YEAR: 'FISCAL_YEAR',
  HALF_YEAR: 'HALF_YEAR',
  MONTH: 'MONTH',
  NONE: 'NONE',
  QUARTER: 'QUARTER',
  WEEK: 'WEEK',
  YEAR: 'YEAR',
};

export type BucketType = $Values<BucketTypeMap>;

export const BUCKET_TYPE: BucketTypeMap = {
  DAY: 'DAY',
  FISCAL_QUARTER: 'FISCAL_QUARTER',
  FISCAL_YEAR: 'FISCAL_YEAR',
  HALF_YEAR: 'HALF_YEAR',
  MONTH: 'MONTH',
  NONE: 'NONE',
  QUARTER: 'QUARTER',
  WEEK: 'WEEK',
  YEAR: 'YEAR',
};

type BucketGranularityBackendNamesMap = {
  ALL: 'all',
  DAY: 'day',
  FISCAL_QUARTER: 'fiscal_quarter',
  FISCAL_YEAR: 'fiscal_year',
  MONTH: 'month',
  QUARTER: 'quarter',
  WEEK: 'week',
  YEAR: 'year',
};

// Granularity names that the backend expects.
// TODO: Just consolidate this with BUCKET_TYPE so that it
// doesn't need to be defined twice. This might require a rewrite of saved
// dashboards.
// TODO: THIS SHOULD LIVE SOMEWHERE ELSE.
export const BACKEND_GRANULARITIES: BucketGranularityBackendNamesMap = {
  ALL: 'all',
  DAY: 'day',
  FISCAL_QUARTER: 'fiscal_quarter',
  FISCAL_YEAR: 'fiscal_year',
  MONTH: 'month',
  QUARTER: 'quarter',
  WEEK: 'week',
  YEAR: 'year',
};

export function getBucketForDate(
  dateInput: string,
  bucketType: BucketType,
): string {
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

export function getForecastFieldId(fieldId: string): string {
  return `forecast_${fieldId}`;
}

export function buildPlotlyDateLabels(
  labels: $ReadOnlyArray<string>,
  padLeft: boolean = false,
): $ReadOnlyArray<string> {
  // NOTE: Since our pretty date labels are not always unique
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
