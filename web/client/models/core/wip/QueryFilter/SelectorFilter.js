// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Dimension from 'models/core/wip/Dimension';
import DimensionService from 'services/wip/DimensionService';
import type { Serializable } from 'lib/Zen';

type Values = {
  dimension: Dimension,
  value: string,
};

type SerializedSelectorFilter = {
  type: 'SELECTOR',
  dimension: Zen.Serialized<Dimension>,
  value: string,
};

class SelectorFilter extends Zen.BaseModel<SelectorFilter, Values>
  implements Serializable<SerializedSelectorFilter> {
  tag: 'SELECTOR' = 'SELECTOR';

  static deserializeAsync(
    values: SerializedSelectorFilter,
  ): Promise<Zen.Model<SelectorFilter>> {
    const { value } = values;
    const dimensionURI = values.dimension.$ref;
    return DimensionService.get(
      DimensionService.convertURIToID(dimensionURI),
    ).then(dimension => SelectorFilter.create({ dimension, value }));
  }

  static UNSAFE_deserialize(
    values: SerializedSelectorFilter,
  ): Zen.Model<SelectorFilter> {
    const { value } = values;
    const dimension = DimensionService.UNSAFE_get(
      DimensionService.convertURIToID(values.dimension.$ref),
    );
    return SelectorFilter.create({ dimension, value });
  }

  serialize(): SerializedSelectorFilter {
    return {
      type: this.tag,
      dimension: this._.dimension().serialize(),
      value: this._.value(),
    };
  }
}

export default ((SelectorFilter: any): Class<Zen.Model<SelectorFilter>>);
