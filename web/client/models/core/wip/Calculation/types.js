// @flow
import * as Zen from 'lib/Zen';
import type AverageCalculation from 'models/core/wip/Calculation/AverageCalculation';
import type AverageOverTimeCalculation from 'models/core/wip/Calculation/AverageOverTimeCalculation';
import type CohortCalculation from 'models/core/wip/Calculation/CohortCalculation';
import type ComplexCalculation from 'models/core/wip/Calculation/ComplexCalculation';
import type CountCalculation from 'models/core/wip/Calculation/CountCalculation';
import type CountDistinctCalculation from 'models/core/wip/Calculation/CountDistinctCalculation';
import type FormulaCalculation from 'models/core/wip/Calculation/FormulaCalculation';
import type LastValueCalculation from 'models/core/wip/Calculation/LastValueCalculation';
import type MaxCalculation from 'models/core/wip/Calculation/MaxCalculation';
import type MinCalculation from 'models/core/wip/Calculation/MinCalculation';
import type SumCalculation from 'models/core/wip/Calculation/SumCalculation';
import type WindowCalculation from 'models/core/wip/Calculation/WindowCalculation';

export type CalculationMap = {
  AVG: AverageCalculation,
  AVERAGE_OVER_TIME: AverageOverTimeCalculation,
  COHORT: CohortCalculation,
  COMPLEX: ComplexCalculation,
  COUNT: CountCalculation,
  COUNT_DISTINCT: CountDistinctCalculation,
  FORMULA: FormulaCalculation,
  LAST_VALUE: LastValueCalculation,
  MAX: MaxCalculation,
  MIN: MinCalculation,
  SUM: SumCalculation,
  WINDOW: WindowCalculation,
};

export type CalculationType = $Keys<CalculationMap>;
export type Calculation = $Values<CalculationMap>;

export type SerializedCalculation =
  | Zen.Serialized<AverageCalculation>
  | Zen.Serialized<AverageOverTimeCalculation>
  | Zen.Serialized<CohortCalculation>
  | Zen.Serialized<ComplexCalculation>
  | Zen.Serialized<CountCalculation>
  | Zen.Serialized<CountDistinctCalculation>
  | Zen.Serialized<FormulaCalculation>
  | Zen.Serialized<LastValueCalculation>
  | Zen.Serialized<MaxCalculation>
  | Zen.Serialized<MinCalculation>
  | Zen.Serialized<SumCalculation>
  | Zen.Serialized<WindowCalculation>;

// A union of all calculations that have a filter (i.e. excludes
// ComplexCalculation)
export type CalculationWithFilter = $Values<CalculationMap>;
