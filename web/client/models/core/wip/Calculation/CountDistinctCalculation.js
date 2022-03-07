// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Dimension from 'models/core/wip/Dimension';
import QueryFilterUtil from 'models/core/wip/QueryFilter/QueryFilterUtil';
import type {
  QueryFilter,
  SerializedQueryFilter,
} from 'models/core/wip/QueryFilter/types';
import type { Serializable } from 'lib/Zen';

type Values = {
  dimension: string,
  filter: QueryFilter | null,
};

type SerializedCountDistinctCalculation = {
  dimension: string,
  type: 'COUNT_DISTINCT',

  // NOTE(stephen): An empty object is a valid serialized filter, but it will
  // cause issues with flow if the type is defined with it. Choosing to define
  // an object with an optional type property so we can get flow to properly
  // refine during deserialization. It will never be used.
  filter: SerializedQueryFilter | { type?: void, ... } | null,
};

/**
 * Calculate the unique number of dimensions that pass the supplied filter.
 *
 * Example: Count the number of facilities that have reported a value for
 * field IDs field_112 and field_288. Store the result as calc_0.
 *
 * In SQL, you might write this calculation, depending on the query engine,
 * like this:
 *   - Using COUNT DISTINCT:
 *       COUNT DISTINCT(
 *         IF(
 *           (field = 'field_112' OR field = 'field_288'),
 *           facility,
 *           NULL
 *         )
 *       ) AS calc_0
 *
 * Here, you would write:
 * // Aquire some reference to the "facility" dimension model.
 * const facilityDimension = ... ;
 *
 * const calculation = CountDistinctCalculation.create({
 *   id: 'calc_0',
 *   dimension: facilityDimension,
 *   filter: OrFilter({
 *     fields: ZenArray.create([
 *       FieldFilter.create({ fieldId: 'field_112' }),
 *       FieldFilter.create({ fieldId: 'field_288' }),
 *     ]),
 *   }),
 * });
 */
class CountDistinctCalculation
  extends Zen.BaseModel<CountDistinctCalculation, Values>
  implements Serializable<SerializedCountDistinctCalculation> {
  tag: 'COUNT_DISTINCT' = 'COUNT_DISTINCT';

  static deserializeAsync(
    values: SerializedCountDistinctCalculation,
  ): Promise<Zen.Model<CountDistinctCalculation>> {
    const { dimension, filter } = values;
    const newDimension = Dimension.deserializeToString(dimension);
    if (filter === null || filter.type === undefined) {
      return Promise.resolve(
        CountDistinctCalculation.create({
          dimension: newDimension,
          filter: null,
        }),
      );
    }
    return QueryFilterUtil.deserializeAsync(filter).then(deserializedFilter => {
      // TODO(stephen): Fix Promise.all type to have flow properly understand
      // the return types instead of having to manually pull them out.
      return CountDistinctCalculation.create({
        dimension: newDimension,
        filter: deserializedFilter,
      });
    });
  }

  static UNSAFE_deserialize(
    values: SerializedCountDistinctCalculation,
  ): Zen.Model<CountDistinctCalculation> {
    const { dimension, filter } = values;
    const newDimension = Dimension.deserializeToString(dimension);
    if (filter === null || filter.type === undefined) {
      return CountDistinctCalculation.create({
        dimension: newDimension,
        filter: null,
      });
    }

    return CountDistinctCalculation.create({
      dimension: newDimension,
      filter: QueryFilterUtil.UNSAFE_deserialize(filter),
    });
  }

  serialize(): SerializedCountDistinctCalculation {
    const filter = this._.filter();
    return {
      type: this.tag,
      dimension: this._.dimension(),
      filter: filter ? filter.serialize() : {},
    };
  }
}

export default ((CountDistinctCalculation: $Cast): Class<
  Zen.Model<CountDistinctCalculation>,
>);
