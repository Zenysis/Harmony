// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Dimension from 'models/core/wip/Dimension';
import DimensionService from 'services/wip/DimensionService';
import type { JSONRef } from 'services/types/api';
import type { Serializable } from 'lib/Zen';

type Values = {
  dimension: Dimension,
  values: Zen.Array<string>,
};

type SerializedInFilter = {
  type: 'IN',
  dimension: JSONRef,
  values: $ReadOnlyArray<string>,
};

/**
 * The InFilter represents the IN operation applied for a specific dimension and
 * a list of possible values. It is equivalent to an OR operation applied for
 * each value in the list of values. If the dimension's value matches any of the
 * filter values, then the row will be included.
 */
class InFilter extends Zen.BaseModel<InFilter, Values>
  implements Serializable<SerializedInFilter> {
  tag: 'IN' = 'IN';

  static deserializeAsync(
    values: SerializedInFilter,
  ): Promise<Zen.Model<InFilter>> {
    const dimensionURI = values.dimension.$ref;
    return DimensionService.get(
      DimensionService.convertURIToID(dimensionURI),
    ).then(dimension =>
      InFilter.create({
        dimension,
        values: Zen.Array.create(values.values),
      }),
    );
  }

  static UNSAFE_deserialize(values: SerializedInFilter): Zen.Model<InFilter> {
    const dimension = DimensionService.UNSAFE_get(
      DimensionService.convertURIToID(values.dimension.$ref),
    );
    return InFilter.create({
      dimension,
      values: Zen.Array.create(values.values),
    });
  }

  serialize(): SerializedInFilter {
    return {
      type: this.tag,
      dimension: this._.dimension().serialize(),
      values: this._.values().arrayView(),
    };
  }
}

export default ((InFilter: any): Class<Zen.Model<InFilter>>);
