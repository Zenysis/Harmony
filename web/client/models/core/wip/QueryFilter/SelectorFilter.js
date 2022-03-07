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
  type: 'SELECTOR',
  dimension: string,
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
        dimension: Dimension.deserializeToString(dimension),
        value,
      }),
    );
  }

  static UNSAFE_deserialize(
    values: SerializedSelectorFilter,
  ): Zen.Model<SelectorFilter> {
    const { dimension, value } = values;
    return SelectorFilter.create({
      dimension: Dimension.deserializeToString(dimension),
      value,
    });
  }

  serialize(): SerializedSelectorFilter {
    return {
      type: this.tag,
      dimension: this._.dimension(),
      value: this._.value(),
    };
  }
}

export default ((SelectorFilter: $Cast): Class<Zen.Model<SelectorFilter>>);
