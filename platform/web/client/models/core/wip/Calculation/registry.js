// @flow
import I18N from 'lib/I18N';
import type { CalculationType } from 'models/core/wip/Calculation/types';

export const CALCULATION_DISPLAY_NAMES: {
  [CalculationType]: string,
} = {
  AVERAGE_OVER_TIME: I18N.text('Average Over Time'),
  AVG: I18N.textById('Average'),
  COMPLEX: I18N.text('Complex'),
  COUNT: I18N.textById('Count'),
  COUNT_DISTINCT: I18N.text('Count Distinct'),
  FORMULA: I18N.textById('Formula'),
  LAST_VALUE: I18N.text('Last Value'),
  MAX: I18N.text('Max'),
  MIN: I18N.text('Min'),
  SUM: I18N.textById('Sum'),
  WINDOW: I18N.text('Moving Window'),
};

// TODO: Currently unused, should descriptions be added somewhere?
export const CALCULATION_DESCRIPTION: {
  [CalculationType]: string,
} = {
  AVERAGE_OVER_TIME: I18N.text(
    'Find the average value of the data points reported over time.',
  ),
  AVG: I18N.text('Find the average value of the data points reported.'),
  COMPLEX: I18N.text('Compute the value of the complex data type.'),
  COUNT: I18N.text('Count the number of data points reported.'),
  COUNT_DISTINCT: I18N.text('Count the unique number of dimension values.'),
  FORMULA: I18N.text('Compute the value by evaluating a mathematical formula.'),
  LAST_VALUE: I18N.text(
    'Calculate the value of the data points with the latest date',
  ),
  MAX: I18N.text('Find the largest single data point reported.'),
  MIN: I18N.text('Find the smallest single data point reported.'),
  SUM: I18N.text('Sum the data points reported.'),
  WINDOW: I18N.text('Calculate the value over a moving window of time.'),
};

export const CALCULATION_ORDER: $ReadOnlyArray<CalculationType> = [
  'SUM',
  'COUNT',
  'AVG',
  'MIN',
  'MAX',
  'WINDOW',
  'COUNT_DISTINCT',
];
