// @flow
import type { CalculationType } from 'models/core/wip/Calculation/types';

const TEXT = t('models.core.Calculation');
export const CALCULATION_DISPLAY_NAMES: { [CalculationType]: string } = {
  AVG: TEXT.AverageCalculation.displayName,
  COMPLEX: TEXT.ComplexCalculation.displayName,
  COUNT: TEXT.CountCalculation.displayName,
  COUNT_DISTINCT: TEXT.CountDistinctCalculation.displayName,
  MAX: TEXT.MaxCalculation.displayName,
  MIN: TEXT.MinCalculation.displayName,
  SUM: TEXT.SumCalculation.displayName,
};

export const CALCULATION_ORDER: $ReadOnlyArray<CalculationType> = [
  'SUM',
  'COUNT',
  'AVG',
  'MIN',
  'MAX',
  'COUNT_DISTINCT',
];
