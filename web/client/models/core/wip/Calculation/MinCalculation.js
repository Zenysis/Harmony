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

type SerializedMinCalculation = {
  type: 'MIN',
  filter: SerializedQueryFilter,
};

/**
 * Find the smallest value that passes the supplied filter.
 *
 * Example: Calculate the min for field ID field_112 and store it as ID calc_0.
 * In SQL, you might write: MIN(IF(field = 'field_112', val, 0)) AS calc_0
 *
 * Here, you would write:
 * const calculation = MinCalculation.create({
 *   id: 'calc_0',
 *   filter: FieldFilter.create({
 *     fieldId: 'field_112',
 *   }),
 * });
 */
class MinCalculation extends Zen.BaseModel<MinCalculation, Values>
  implements Serializable<SerializedMinCalculation> {
  tag: 'MIN' = 'MIN';

  static deserializeAsync(
    values: SerializedMinCalculation,
  ): Promise<Zen.Model<MinCalculation>> {
    return QueryFilterUtil.deserializeAsync(values.filter).then(filter =>
      MinCalculation.create({ filter }),
    );
  }

  static UNSAFE_deserialize(
    values: SerializedMinCalculation,
  ): Zen.Model<MinCalculation> {
    const filter = QueryFilterUtil.UNSAFE_deserialize(values.filter);
    return MinCalculation.create({ filter });
  }

  serialize(): SerializedMinCalculation {
    return {
      type: this.tag,
      filter: this._.filter().serialize(),
    };
  }
}

export default ((MinCalculation: $Cast): Class<Zen.Model<MinCalculation>>);
