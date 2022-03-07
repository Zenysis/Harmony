// @flow
import * as Zen from 'lib/Zen';
import QueryFilterUtil from 'models/core/wip/QueryFilter/QueryFilterUtil';
import type {
  QueryFilter,
  SerializedQueryFilter,
} from 'models/core/wip/QueryFilter/types';
import type { Serializable } from 'lib/Zen';

type Values = {
  filter: QueryFilter,
};

type SerializedAverageCalculation = {
  type: 'AVG',
  filter: SerializedQueryFilter,
};

/**
 * Calculate the average of all values that pass the supplied filter.
 *
 * Example: Calculate the average for field ID field_112 and store it as
 * ID calc_0.
 * In SQL, you might write: AVG(IF(field = 'field_112', val, NULL)) AS calc_0
 *
 * Here, you would write:
 * const calculation = AverageCalculation.create({
 *   id: 'calc_0',
 *   filter: FieldFilter.create({
 *     fieldId: 'field_112',
 *   }),
 * });
 */
class AverageCalculation extends Zen.BaseModel<AverageCalculation, Values>
  implements Serializable<SerializedAverageCalculation> {
  tag: 'AVG' = 'AVG';

  static deserializeAsync(
    values: SerializedAverageCalculation,
  ): Promise<Zen.Model<AverageCalculation>> {
    return QueryFilterUtil.deserializeAsync(values.filter).then(filter =>
      AverageCalculation.create({ filter }),
    );
  }

  static UNSAFE_deserialize(
    values: SerializedAverageCalculation,
  ): Zen.Model<AverageCalculation> {
    const filter = QueryFilterUtil.UNSAFE_deserialize(values.filter);
    return AverageCalculation.create({ filter });
  }

  serialize(): SerializedAverageCalculation {
    return {
      type: this.tag,
      filter: this._.filter().serialize(),
    };
  }
}

export default ((AverageCalculation: $Cast): Class<
  Zen.Model<AverageCalculation>,
>);
