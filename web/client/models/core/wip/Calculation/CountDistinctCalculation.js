// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Dimension from 'models/core/wip/Dimension';
import DimensionService from 'services/wip/DimensionService';
import QueryFilterUtil from 'models/core/wip/QueryFilter/QueryFilterUtil';
import type { JSONRef } from 'services/types/api';
import type {
  QueryFilter,
  SerializedQueryFilter,
} from 'models/core/wip/QueryFilter/types';
import type { Serializable } from 'lib/Zen';

type Values = {
  dimension: Dimension,
  filter: QueryFilter | null,
};

type SerializedCountDistinctCalculation = {
  dimension: JSONRef,
  type: 'COUNT_DISTINCT',

  // NOTE(stephen): An empty object is a valid serialized filter, but it will
  // cause issues with flow if the type is defined with it. Choosing to define
  // an object with an optional type property so we can get flow to properly
  // refine during deserialization. It will never be used.
  filter: SerializedQueryFilter | { type?: void } | null,
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
    const dimensionURI = values.dimension.$ref;
    const dimensionPromise = DimensionService.get(
      DimensionService.convertURIToID(dimensionURI),
    );
    const serializedFilter = values.filter;
    if (serializedFilter === null || serializedFilter.type === undefined) {
      return dimensionPromise.then((dimension: Dimension) =>
        CountDistinctCalculation.create({ dimension, filter: null }),
      );
    }
    return Promise.all([
      DimensionService.get(DimensionService.convertURIToID(dimensionURI)),
      QueryFilterUtil.deserializeAsync(serializedFilter),
    ]).then(result => {
      // TODO(stephen): Fix Promise.all type to have flow properly understand
      // the return types instead of having to manually pull them out.
      const dimension: Dimension = result[0];
      const filter: QueryFilter = result[1];
      return CountDistinctCalculation.create({ dimension, filter });
    });
  }

  static UNSAFE_deserialize(
    values: SerializedCountDistinctCalculation,
  ): Zen.Model<CountDistinctCalculation> {
    const dimension = DimensionService.UNSAFE_get(
      DimensionService.convertURIToID(values.dimension.$ref),
    );
    if (values.filter === null || values.filter.type === undefined) {
      return CountDistinctCalculation.create({ dimension, filter: null });
    }

    return CountDistinctCalculation.create({
      dimension,
      filter: QueryFilterUtil.UNSAFE_deserialize(values.filter),
    });
  }

  serialize(): SerializedCountDistinctCalculation {
    const filter = this._.filter();
    return {
      type: this.tag,
      dimension: this._.dimension().serialize(),
      filter: filter ? filter.serialize() : {},
    };
  }
}

export default ((CountDistinctCalculation: any): Class<
  Zen.Model<CountDistinctCalculation>,
>);
