// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type Values = {
  fieldIds: $ReadOnlyArray<string>,
};

type SerializedFieldInFilter = {
  fieldIds: $ReadOnlyArray<string>,
  type: 'FIELD_IN',
};

/**
 * Represents a filter over a specific set of calculable fields.
 */
class FieldInFilter extends Zen.BaseModel<FieldInFilter, Values>
  implements Serializable<SerializedFieldInFilter> {
  tag: 'FIELD_IN' = 'FIELD_IN';

  static deserialize(
    values: SerializedFieldInFilter,
  ): Zen.Model<FieldInFilter> {
    const { fieldIds } = values;
    return FieldInFilter.create({ fieldIds });
  }

  static deserializeAsync(
    values: SerializedFieldInFilter,
  ): Promise<Zen.Model<FieldInFilter>> {
    return Promise.resolve(FieldInFilter.deserialize(values));
  }

  static UNSAFE_deserialize(
    values: SerializedFieldInFilter,
  ): Zen.Model<FieldInFilter> {
    return FieldInFilter.deserialize(values);
  }

  serialize(): SerializedFieldInFilter {
    return {
      fieldIds: this._.fieldIds(),
      type: this.tag,
    };
  }
}

export default ((FieldInFilter: $Cast): Class<Zen.Model<FieldInFilter>>);
