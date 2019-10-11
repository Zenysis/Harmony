import numeral from 'numeral';

const PERCENT_FORMAT = '0.0%';

export function formatPercent(percent, includeSign = true) {
  if (!percent) {
    return '';
  }
  if (includeSign) {
    return numeral(percent).format(`+${PERCENT_FORMAT}`);
  }
  return numeral(Math.abs(percent)).format(PERCENT_FORMAT);
}

export function getPercentChange(startValue, endValue) {
  // Limit percent change to +-5000%. Assume values outside this range are
  // an error and return no percent change.
  if (Math.abs((endValue - startValue) / startValue) > 50) {
    return null;
  }
  return startValue && endValue ? (endValue - startValue) / startValue : null;
}
