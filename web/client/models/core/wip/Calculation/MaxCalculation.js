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

type SerializedMaxCalculation = {
  type: 'MAX',
  filter: SerializedQueryFilter,
};

/**
 * Find the largest value that passes the supplied filter.
 *
 * Example: Calculate the max for field ID field_112 and store it as ID calc_0.
 * In SQL, you might write: MAX(IF(field = 'field_112', val, 0)) AS calc_0
 *
 * Here, you would write:
 * const calculation = MaxCalculation.create({
 *   id: 'calc_0',
 *   filter: FieldFilter.create({
 *     fieldId: 'field_112',
 *   }),
 * });
 */
class MaxCalculation extends Zen.BaseModel<MaxCalculation, Values>
  implements Serializable<SerializedMaxCalculation> {
  tag: 'MAX' = 'MAX';

  static deserializeAsync(
    values: SerializedMaxCalculation,
  ): Promise<Zen.Model<MaxCalculation>> {
    return QueryFilterUtil.deserializeAsync(values.filter).then(filter =>
      MaxCalculation.create({ filter }),
    );
  }

  static UNSAFE_deserialize(
    values: SerializedMaxCalculation,
  ): Zen.Model<MaxCalculation> {
    const filter = QueryFilterUtil.UNSAFE_deserialize(values.filter);
    return MaxCalculation.create({ filter });
  }

  serialize(): SerializedMaxCalculation {
    return {
      type: this.tag,
      filter: this._.filter().serialize(),
    };
  }
}

export default ((MaxCalculation: $Cast): Class<Zen.Model<MaxCalculation>>);
