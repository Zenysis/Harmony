// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Dimension from 'models/core/wip/Dimension';
import type { Serializable } from 'lib/Zen';

type Values = {
  dimension: string,
  values: Zen.Array<string>,
};

type SerializedInFilter = {
  type: 'IN',
  dimension: string,
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
    return Promise.resolve(
      InFilter.create({
        dimension: Dimension.deserializeToString(values.dimension),
        values: Zen.Array.create(values.values),
      }),
    );
  }

  static UNSAFE_deserialize(values: SerializedInFilter): Zen.Model<InFilter> {
    return InFilter.create({
      dimension: Dimension.deserializeToString(values.dimension),
      values: Zen.Array.create(values.values),
    });
  }

  serialize(): SerializedInFilter {
    return {
      type: this.tag,
      dimension: this._.dimension(),
      values: this._.values().arrayView(),
    };
  }
}

export default ((InFilter: $Cast): Class<Zen.Model<InFilter>>);
