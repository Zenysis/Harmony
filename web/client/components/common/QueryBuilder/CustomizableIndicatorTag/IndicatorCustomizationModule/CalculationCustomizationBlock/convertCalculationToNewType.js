// @flow
import * as Zen from 'lib/Zen';
import CalculationUtil from 'models/core/wip/Calculation/CalculationUtil';
import CountDistinctCalculation from 'models/core/wip/Calculation/CountDistinctCalculation';
import type Dimension from 'models/core/wip/Dimension';
import type {
  Calculation,
  CalculationType,
} from 'models/core/wip/Calculation/types';
import type { QueryFilter } from 'models/core/wip/QueryFilter/types';

/**
 * @param {Calculation} calculation The calculation we are casting
 * @param {CalculationType} calculationType The type we are casting to
 * @param {Dimension} defaultDimension The default dimension to use for a
 * calculation if one is needed.
 * @param {string} fieldName The field name
 * @param {QueryFilter | null} newFilter The filter to use
 */
export default function convertCalculationToNewType(
  calculation: Calculation,
  calculationType: CalculationType,
  defaultDimension: Dimension,
  fieldName: string,
  newFilter: QueryFilter | null,
): Calculation {
  const filter = newFilter || calculation.get('filter');
  if (calculationType === 'COUNT_DISTINCT') {
    return CountDistinctCalculation.create({
      dimension: defaultDimension.id(),
      filter,
    });
  }

  if (filter !== null) {
    return CalculationUtil.castCalculation(
      calculationType,
      calculation,
      filter,
    );
  }
  return CalculationUtil.castCalculation(calculationType, calculation);
}
