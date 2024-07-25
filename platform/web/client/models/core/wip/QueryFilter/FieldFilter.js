// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type Values = {
  fieldId: string,
};

type SerializedFieldFilter = {
  fieldId: string,
  type: 'FIELD',
};

/**
 * Represents a filter over a specific calculable field.
 */
class FieldFilter extends Zen.BaseModel<FieldFilter, Values>
  implements Serializable<SerializedFieldFilter> {
  tag: 'FIELD' = 'FIELD';

  static deserialize(values: SerializedFieldFilter): Zen.Model<FieldFilter> {
    const { fieldId } = values;
    return FieldFilter.create({ fieldId });
  }

  static deserializeAsync(
    values: SerializedFieldFilter,
  ): Promise<Zen.Model<FieldFilter>> {
    return Promise.resolve(FieldFilter.deserialize(values));
  }

  static UNSAFE_deserialize(
    values: SerializedFieldFilter,
  ): Zen.Model<FieldFilter> {
    return FieldFilter.deserialize(values);
  }

  serialize(): SerializedFieldFilter {
    return {
      fieldId: this._.fieldId(),
      type: this.tag,
    };
  }
}

export default ((FieldFilter: $Cast): Class<Zen.Model<FieldFilter>>);
