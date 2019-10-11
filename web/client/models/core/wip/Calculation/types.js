// @flow
import * as Zen from 'lib/Zen';
import type AverageCalculation from 'models/core/wip/Calculation/AverageCalculation';
import type ComplexCalculation from 'models/core/wip/Calculation/ComplexCalculation';
import type CountCalculation from 'models/core/wip/Calculation/CountCalculation';
import type CountDistinctCalculation from 'models/core/wip/Calculation/CountDistinctCalculation';
import type MaxCalculation from 'models/core/wip/Calculation/MaxCalculation';
import type MinCalculation from 'models/core/wip/Calculation/MinCalculation';
import type SumCalculation from 'models/core/wip/Calculation/SumCalculation';

type CalculationMap = {
  AVG: AverageCalculation,
  COMPLEX: ComplexCalculation,
  COUNT: CountCalculation,
  COUNT_DISTINCT: CountDistinctCalculation,
  MAX: MaxCalculation,
  MIN: MinCalculation,
  SUM: SumCalculation,
};

export type CalculationType = $Keys<CalculationMap>;
export type Calculation = $Values<CalculationMap>;

export type SerializedCalculation =
  | Zen.Serialized<AverageCalculation>
  | Zen.Serialized<ComplexCalculation>
  | Zen.Serialized<CountCalculation>
  | Zen.Serialized<CountDistinctCalculation>
  | Zen.Serialized<MaxCalculation>
  | Zen.Serialized<MinCalculation>
  | Zen.Serialized<SumCalculation>;

// A union of all calculations that have a filter (i.e. excludes
// ComplexCalculation)
export type CalculationWithFilter = $Values<CalculationMap>;
