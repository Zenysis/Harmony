// @flow
import type {
  CalculationMap,
  CalculationType,
} from 'models/core/wip/Calculation/types';

const TEXT = t('models.core.Calculation');
export const CALCULATION_DISPLAY_NAMES: $ObjMap<
  CalculationMap,
  () => string,
> = {
  AVG: TEXT.AverageCalculation.displayName,
  AVERAGE_OVER_TIME: TEXT.AverageOverTimeCalculation.displayName,
  COHORT: TEXT.CohortCalculation.displayName,
  COMPLEX: TEXT.ComplexCalculation.displayName,
  COUNT: TEXT.CountCalculation.displayName,
  COUNT_DISTINCT: TEXT.CountDistinctCalculation.displayName,
  FORMULA: TEXT.FormulaCalculation.displayName,
  LAST_VALUE: TEXT.LastValueCalculation.displayName,
  MAX: TEXT.MaxCalculation.displayName,
  MIN: TEXT.MinCalculation.displayName,
  SUM: TEXT.SumCalculation.displayName,
  WINDOW: TEXT.WindowCalculation.displayName,
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
