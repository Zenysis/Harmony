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

type SerializedSumCalculation = {
  type: 'SUM',
  filter: SerializedQueryFilter,
};

/**
 * Sum all values that pass the supplied filter.
 *
 * Example: Sum field IDs field_112 and field_288 and store it as ID calc_0.
 * In SQL, you might write:
 * SUM(IF(field = 'field_112' OR field='field_288', val, 0)) AS calc_0
 *
 * Here, you would write:
 * const calculation = SumCalculation.create({
 *   id: 'calc_0',
 *   filter: OrFilter({
 *     fields: ZenArray.create([
 *       FieldFilter.create({ fieldId: 'field_112' }),
 *       FieldFilter.create({ fieldId: 'field_288' }),
 *     ]),
 *   }),
 * });
 */
class SumCalculation extends Zen.BaseModel<SumCalculation, Values>
  implements Serializable<SerializedSumCalculation> {
  tag: 'SUM' = 'SUM';

  static deserializeAsync(
    values: SerializedSumCalculation,
  ): Promise<Zen.Model<SumCalculation>> {
    return QueryFilterUtil.deserializeAsync(values.filter).then(filter =>
      SumCalculation.create({ filter }),
    );
  }

  static UNSAFE_deserialize(
    values: SerializedSumCalculation,
  ): Zen.Model<SumCalculation> {
    const filter = QueryFilterUtil.UNSAFE_deserialize(values.filter);
    return SumCalculation.create({ filter });
  }

  serialize(): SerializedSumCalculation {
    return {
      type: this.tag,
      filter: this._.filter().serialize(),
    };
  }
}

export default ((SumCalculation: $Cast): Class<Zen.Model<SumCalculation>>);
