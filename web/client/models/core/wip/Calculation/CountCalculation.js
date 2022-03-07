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

type SerializedCountCalculation = {
  type: 'COUNT',
  filter: SerializedQueryFilter,
};

/**
 * Calculate the number of rows that pass the supplied filter.
 *
 * Example: Count the number of times facility AX has reported a value for
 * field IDs field_112 and field_288. Store the result as calc_0.
 *
 * In SQL, here are a couple ways you might write this calculation, depending
 * on the query engine.
 * NOTE(stephen): There are many possible ways to write this query.
 *   - Using COUNT:
 *       COUNT(
 *         IF(
 *           facility = 'AX' AND (field = 'field_112' OR field = 'field_288'),
 *           1,
 *           NULL
 *         )
 *       ) AS calc_0
 *   - Using SUM:
 *       SUM(
 *         IF(
 *           facility = 'AX' AND (field = 'field_112' OR field = 'field_288'),
 *           1,
 *           0
 *         )
 *       ) AS calc_0
 *
 * Here, you would write:
 * // Aquire some reference to the "facility" dimension model.
 * const facilityDimension = ... ;
 *
 * const calculation = CountCalculation.create({
 *   id: 'calc_0',
 *   filter: AndFilter({
 *     fields: ZenArray.create([
 *       SelectorFilter.create({
 *         dimension: facilityDimension,
 *         value: 'AX',
 *       }),
 *       OrFilter({
 *         fields: ZenArray.create([
 *           FieldFilter.create({ fieldId: 'field_112' }),
 *           FieldFilter.create({ fieldId: 'field_288' }),
 *         ]),
 *       }),
 *     ]),
 *   }),
 * });
 */
class CountCalculation extends Zen.BaseModel<CountCalculation, Values>
  implements Serializable<SerializedCountCalculation> {
  tag: 'COUNT' = 'COUNT';

  static deserializeAsync(
    values: SerializedCountCalculation,
  ): Promise<Zen.Model<CountCalculation>> {
    return QueryFilterUtil.deserializeAsync(values.filter).then(filter =>
      CountCalculation.create({ filter }),
    );
  }

  static UNSAFE_deserialize(
    values: SerializedCountCalculation,
  ): Zen.Model<CountCalculation> {
    const filter = QueryFilterUtil.UNSAFE_deserialize(values.filter);
    return CountCalculation.create({ filter });
  }

  serialize(): SerializedCountCalculation {
    return {
      type: this.tag,
      filter: this._.filter().serialize(),
    };
  }
}

export default ((CountCalculation: $Cast): Class<Zen.Model<CountCalculation>>);
