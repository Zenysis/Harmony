// @flow
import * as Zen from 'lib/Zen';
import QueryFilterUtil from 'models/core/wip/QueryFilter/QueryFilterUtil';
import type {
  QueryFilter,
  SerializedQueryFilter,
} from 'models/core/wip/QueryFilter/types';
import type { Serializable } from 'lib/Zen';

export type AggregationOperation = 'average' | 'count' | 'max' | 'min' | 'sum';

type RequiredValues = {
  filter: QueryFilter,
};

type DefaultValues = {
  +operation: AggregationOperation,
};

type SerializedLastValueCalculation = {
  type: 'LAST_VALUE',
  filter: SerializedQueryFilter,
  operation: 'average' | 'count' | 'max' | 'min' | 'sum',
};

/**
 * Aggregate rows with the largest timestamp in the query using the given
 * aggregation operation.
 */
class LastValueCalculation
  extends Zen.BaseModel<LastValueCalculation, RequiredValues, DefaultValues>
  implements Serializable<SerializedLastValueCalculation> {
  static defaultValues: DefaultValues = { operation: 'sum' };

  tag: 'LAST_VALUE' = 'LAST_VALUE';

  static deserializeAsync(
    values: SerializedLastValueCalculation,
  ): Promise<Zen.Model<LastValueCalculation>> {
    return QueryFilterUtil.deserializeAsync(values.filter).then(filter =>
      LastValueCalculation.create({
        filter,
        operation: values.operation,
      }),
    );
  }

  static UNSAFE_deserialize(
    values: SerializedLastValueCalculation,
  ): Zen.Model<LastValueCalculation> {
    return LastValueCalculation.create({
      filter: QueryFilterUtil.UNSAFE_deserialize(values.filter),
      operation: values.operation,
    });
  }

  serialize(): SerializedLastValueCalculation {
    return {
      type: this.tag,
      filter: this._.filter().serialize(),
      operation: this._.operation(),
    };
  }
}

export default ((LastValueCalculation: $Cast): Class<
  Zen.Model<LastValueCalculation>,
>);
