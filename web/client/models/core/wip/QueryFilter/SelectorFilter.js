// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Dimension from 'models/core/wip/Dimension';
import type { Serializable } from 'lib/Zen';

type Values = {
  dimension: string,
  value: string,
};

type SerializedSelectorFilter = {
  dimension: string,
  type: 'SELECTOR',
  value: string,
};

/**
 * The SelectorFilter frontend model represents a filtering of a specific
 * value for a dimension.
 */
class SelectorFilter extends Zen.BaseModel<SelectorFilter, Values>
  implements Serializable<SerializedSelectorFilter> {
  tag: 'SELECTOR' = 'SELECTOR';

  static deserializeAsync(
    values: SerializedSelectorFilter,
  ): Promise<Zen.Model<SelectorFilter>> {
    const { dimension, value } = values;
    return Promise.resolve(
      SelectorFilter.create({
        value,
        dimension: Dimension.deserializeToString(dimension),
      }),
    );
  }

  static UNSAFE_deserialize(
    values: SerializedSelectorFilter,
  ): Zen.Model<SelectorFilter> {
    const { dimension, value } = values;
    return SelectorFilter.create({
      value,
      dimension: Dimension.deserializeToString(dimension),
    });
  }

  serialize(): SerializedSelectorFilter {
    return {
      dimension: this._.dimension(),
      type: this.tag,
      value: this._.value(),
    };
  }
}

export default ((SelectorFilter: $Cast): Class<Zen.Model<SelectorFilter>>);
