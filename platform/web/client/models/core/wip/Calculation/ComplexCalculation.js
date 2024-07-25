// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import QueryFilterUtil from 'models/core/wip/QueryFilter/QueryFilterUtil';
import type {
  QueryFilter,
  SerializedQueryFilter,
} from 'models/core/wip/QueryFilter/types';
import type { Serializable } from 'lib/Zen';

type Values = {
  calculationId: string,
  filter: QueryFilter | null,
};

type SerializedComplexCalculation = {
  calculation_id: string,

  // NOTE: An empty object is a valid serialized filter, but it will
  // cause issues with flow if the type is defined with it. Choosing to define
  // an object with an optional type property so we can get flow to properly
  // refine during deserialization. It will never be used.
  filter: SerializedQueryFilter | { type?: void, ... } | null,

  type: 'COMPLEX',
};

/**
 * The ComplexCalculation is a placeholder calculation representing all
 * calculation types that cannot currently be built on the frontend. This
 * includes calculated indicator formulas (x + y - z), "LAST VALUE" calculations
 * (SUM(x) IF time < A and time > B), unique calculations (COUNT DISTINCT), and
 * others.
 * NOTE: ComplexCalculation is a kitchen-sink calculation type
 * for all calculations that cannot be easily calculated. It will be
 * expanded in the future.
 */
class ComplexCalculation extends Zen.BaseModel<ComplexCalculation, Values>
  implements Serializable<SerializedComplexCalculation> {
  tag: 'COMPLEX' = 'COMPLEX';

  static deserializeAsync(
    values: SerializedComplexCalculation,
  ): Promise<Zen.Model<ComplexCalculation>> {
    if (values.filter === null || values.filter.type === undefined) {
      return Promise.resolve(
        ComplexCalculation.create({
          calculationId: values.calculation_id,
          filter: null,
        }),
      );
    }

    return QueryFilterUtil.deserializeAsync(values.filter).then(filter =>
      ComplexCalculation.create({
        filter,
        calculationId: values.calculation_id,
      }),
    );
  }

  static UNSAFE_deserialize(
    values: SerializedComplexCalculation,
  ): Zen.Model<ComplexCalculation> {
    if (values.filter === null || values.filter.type === undefined) {
      return ComplexCalculation.create({
        calculationId: values.calculation_id,
        filter: null,
      });
    }

    return ComplexCalculation.create({
      calculationId: values.calculation_id,
      filter: QueryFilterUtil.UNSAFE_deserialize(values.filter),
    });
  }

  serialize(): SerializedComplexCalculation {
    const filter = this._.filter();
    return {
      calculation_id: this._.calculationId(),
      filter: filter ? filter.serialize() : {},
      type: this.tag,
    };
  }
}

export default ((ComplexCalculation: $Cast): Class<
  Zen.Model<ComplexCalculation>,
>);
