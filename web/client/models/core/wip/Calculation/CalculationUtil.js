// @flow
import * as Zen from 'lib/Zen';
import AndFilter from 'models/core/wip/QueryFilter/AndFilter';
import AverageCalculation from 'models/core/wip/Calculation/AverageCalculation';
import ComplexCalculation from 'models/core/wip/Calculation/ComplexCalculation';
import CountCalculation from 'models/core/wip/Calculation/CountCalculation';
import CountDistinctCalculation from 'models/core/wip/Calculation/CountDistinctCalculation';
import MaxCalculation from 'models/core/wip/Calculation/MaxCalculation';
import MinCalculation from 'models/core/wip/Calculation/MinCalculation';
import SumCalculation from 'models/core/wip/Calculation/SumCalculation';
import type {
  Calculation,
  CalculationType,
  CalculationWithFilter,
  SerializedCalculation,
} from 'models/core/wip/Calculation/types';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

export default class CalculationUtil {
  static deserializeAsync(values: SerializedCalculation): Promise<Calculation> {
    switch (values.type) {
      case 'AVG':
        return AverageCalculation.deserializeAsync(values);
      case 'COMPLEX':
        return ComplexCalculation.deserializeAsync(values);
      case 'COUNT':
        return CountCalculation.deserializeAsync(values);
      case 'COUNT_DISTINCT':
        return CountDistinctCalculation.deserializeAsync(values);
      case 'MAX':
        return MaxCalculation.deserializeAsync(values);
      case 'MIN':
        return MinCalculation.deserializeAsync(values);
      case 'SUM':
        return SumCalculation.deserializeAsync(values);
      default:
        throw new Error(
          `[CalculationUtil] Invalid type provided during deserialization: ${
            values.type
          }`,
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
      case 'COMPLEX':
        return ComplexCalculation.UNSAFE_deserialize(values);
      case 'COUNT':
        return CountCalculation.UNSAFE_deserialize(values);
      case 'COUNT_DISTINCT':
        return CountDistinctCalculation.UNSAFE_deserialize(values);
      case 'MAX':
        return MaxCalculation.UNSAFE_deserialize(values);
      case 'MIN':
        return MinCalculation.UNSAFE_deserialize(values);
      case 'SUM':
        return SumCalculation.UNSAFE_deserialize(values);
      default:
        throw new Error(
          `[CalculationUtil] Invalid type provided during deserialization: ${
            values.type
          }`,
        );
    }
  }

  static castCalculation(
    toType: CalculationType,
    fromModel: Calculation,
  ): Calculation {
    if (fromModel instanceof ComplexCalculation) {
      throw new Error('Cannot cast from a ComplexCalculation.');
    }

    const filterableCalc = Zen.cast<CalculationWithFilter>(fromModel);
    const vals = {
      filter: filterableCalc.get('filter'),
    };

    switch (toType) {
      case 'AVG':
        return AverageCalculation.create(vals);
      case 'COMPLEX':
        throw new Error('Cannot cast to a ComplexCalculation');
      case 'COUNT':
        return CountCalculation.create(vals);
      case 'MAX':
        return MaxCalculation.create(vals);
      case 'MIN':
        return MinCalculation.create(vals);
      case 'SUM':
        return SumCalculation.create(vals);
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
    // dimension filters or date filtrs).
    // TODO(pablo): track the customizable filters in the Calculation model,
    // instead of in the Field model. This way we can just call
    // calculation.serialize() without having to go through CalculationUtil.
    const filters = [];
    customizableFilterItems.forEach((filterItem: QueryFilterItem) => {
      const filter = filterItem.filter();
      if (filter !== undefined) {
        filters.push(filter);
      }
    });

    const serializedCalculation = calculation.serialize();

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
