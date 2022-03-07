// @flow
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import AndFilter from 'models/core/wip/QueryFilter/AndFilter';
import AverageCalculation from 'models/core/wip/Calculation/AverageCalculation';
import AverageOverTimeCalculation from 'models/core/wip/Calculation/AverageOverTimeCalculation';
import CohortCalculation from 'models/core/wip/Calculation/CohortCalculation';
import ComplexCalculation from 'models/core/wip/Calculation/ComplexCalculation';
import CountCalculation from 'models/core/wip/Calculation/CountCalculation';
import CountDistinctCalculation from 'models/core/wip/Calculation/CountDistinctCalculation';
// eslint-disable-next-line import/no-cycle
import FormulaCalculation from 'models/core/wip/Calculation/FormulaCalculation';
import LastValueCalculation from 'models/core/wip/Calculation/LastValueCalculation';
import MaxCalculation from 'models/core/wip/Calculation/MaxCalculation';
import MinCalculation from 'models/core/wip/Calculation/MinCalculation';
import QueryFilterItemUtil from 'models/core/wip/QueryFilterItem/QueryFilterItemUtil';
import SumCalculation from 'models/core/wip/Calculation/SumCalculation';
import WindowCalculation from 'models/core/wip/Calculation/WindowCalculation';
import type {
  Calculation,
  CalculationType,
  CalculationWithFilter,
  SerializedCalculation,
} from 'models/core/wip/Calculation/types';
import type { QueryFilter } from 'models/core/wip/QueryFilter/types';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

export default class CalculationUtil {
  static deserializeAsync(values: SerializedCalculation): Promise<Calculation> {
    switch (values.type) {
      case 'AVG':
        return AverageCalculation.deserializeAsync(values);
      case 'AVERAGE_OVER_TIME':
        return AverageOverTimeCalculation.deserializeAsync(values);
      case 'COHORT':
        return CohortCalculation.deserializeAsync(values);
      case 'COMPLEX':
        return ComplexCalculation.deserializeAsync(values);
      case 'COUNT':
        return CountCalculation.deserializeAsync(values);
      case 'COUNT_DISTINCT':
        return CountDistinctCalculation.deserializeAsync(values);
      case 'FORMULA':
        return FormulaCalculation.deserializeAsync(values);
      case 'LAST_VALUE':
        return LastValueCalculation.deserializeAsync(values);
      case 'MAX':
        return MaxCalculation.deserializeAsync(values);
      case 'MIN':
        return MinCalculation.deserializeAsync(values);
      case 'SUM':
        return SumCalculation.deserializeAsync(values);
      case 'WINDOW':
        return WindowCalculation.deserializeAsync(values);
      default:
        throw new Error(
          `[CalculationUtil] Invalid type provided during deserialization: ${values.type}`,
        );
    }
  }

  /**
   * UNSAFE. Deserialize the provided calculation synchronously. This method
   * requires specific setup to happen to work properly: all services that all
   * Calculations rely on must be initialized, the base CalculationMap must be
   * initialized, and any models (like QueryFilter) that require extra steps for
   * synchronous deserialization to happen must be performed.
   *
   * This method should rarely be used. It exists primarily for performance.
   */
  static UNSAFE_deserialize(values: SerializedCalculation): Calculation {
    switch (values.type) {
      case 'AVG':
        return AverageCalculation.UNSAFE_deserialize(values);
      case 'AVERAGE_OVER_TIME':
        return AverageOverTimeCalculation.UNSAFE_deserialize(values);
      case 'COHORT':
        return CohortCalculation.UNSAFE_deserialize(values);
      case 'COMPLEX':
        return ComplexCalculation.UNSAFE_deserialize(values);
      case 'COUNT':
        return CountCalculation.UNSAFE_deserialize(values);
      case 'COUNT_DISTINCT':
        return CountDistinctCalculation.UNSAFE_deserialize(values);
      case 'FORMULA':
        return FormulaCalculation.UNSAFE_deserialize(values);
      case 'LAST_VALUE':
        return LastValueCalculation.UNSAFE_deserialize(values);
      case 'MAX':
        return MaxCalculation.UNSAFE_deserialize(values);
      case 'MIN':
        return MinCalculation.UNSAFE_deserialize(values);
      case 'SUM':
        return SumCalculation.UNSAFE_deserialize(values);
      case 'WINDOW':
        return WindowCalculation.UNSAFE_deserialize(values);
      default:
        throw new Error(
          `[CalculationUtil] Invalid type provided during deserialization: ${values.type}`,
        );
    }
  }

  static castCalculation(
    toType: CalculationType,
    fromModel: Calculation,
    newFilter?: QueryFilter,
  ): Calculation {
    if (fromModel instanceof ComplexCalculation) {
      throw new Error('Cannot cast from a ComplexCalculation.');
    }

    if (fromModel instanceof FormulaCalculation) {
      throw new Error('Cannot cast from a FormulaCalculation.');
    }

    const filterableCalc = Zen.cast<CalculationWithFilter>(fromModel);
    const filter = newFilter || filterableCalc.get('filter');
    invariant(
      filter !== null,
      'Filter cannot be null since ComplexCalculation and FormulaCalculation were tested for already.',
    );

    const vals: { filter: QueryFilter } = { filter };
    switch (toType) {
      case 'AVG':
        return AverageCalculation.create(vals);
      case 'AVERAGE_OVER_TIME':
        return AverageOverTimeCalculation.create(vals);
      case 'COMPLEX':
        throw new Error('Cannot cast to a ComplexCalculation');
      case 'COUNT':
        return CountCalculation.create(vals);
      case 'FORMULA':
        throw new Error('Cannot cast to a FormulaCalculation');
      case 'LAST_VALUE':
        return LastValueCalculation.create(vals);
      case 'MAX':
        return MaxCalculation.create(vals);
      case 'MIN':
        return MinCalculation.create(vals);
      case 'SUM':
        return SumCalculation.create(vals);
      case 'WINDOW':
        return WindowCalculation.create(vals);
      default:
        throw new Error(
          `[CalculationUtil] Invalid type provided during deserialization: ${toType}`,
        );
    }
  }

  static serializeForQuery(
    calculation: Calculation,
    customizableFilterItems: Zen.Array<QueryFilterItem>,
  ): SerializedCalculation {
    // To correctly serialize a calculation, we have to get its field filter
    // and AND it with any customizable filters we want to apply to it (e.g.
    // dimension filters or date filters).
    // TODO(pablo): track the customizable filters in the Calculation model,
    // instead of in the Field model. This way we can just call
    // calculation.serialize() without having to go through CalculationUtil.
    const filters = [];
    customizableFilterItems.forEach((filterItem: QueryFilterItem) => {
      const filter = QueryFilterItemUtil.getFilter(filterItem);
      if (filter !== undefined) {
        filters.push(filter);
      }
    });

    const serializedCalculation =
      calculation instanceof CohortCalculation ||
      calculation instanceof FormulaCalculation
        ? calculation.serializeForQuery()
        : calculation.serialize();

    // If there are no supplemental filters to construct, serialize the
    // calculation directly.
    if (filters.length === 0) {
      return serializedCalculation;
    }

    const calculationFilter = calculation.get('filter');
    if (calculationFilter !== null) {
      filters.unshift(calculationFilter);
    }

    // Avoid constructing an AND filter if there is only one element.
    const filter =
      filters.length === 1
        ? filters[0]
        : AndFilter.create({ fields: Zen.Array.create(filters) });
    serializedCalculation.filter = filter.serialize();
    return serializedCalculation;
  }
}
