// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type Values = {
  id: string,
  name: string,
  uri: string,
};

type SerializedDimension = {
  $uri: string,
  id: string,
  name: string,
};

/**
 * Dimension class for indicator management.
 */
class Dimension extends Zen.BaseModel<Dimension, Values>
  implements Serializable<SerializedDimension> {
  static deserialize(values: SerializedDimension): Zen.Model<Dimension> {
    const { $uri, id, name } = values;
    return Dimension.create({ id, name, uri: $uri });
  }

  serialize(): SerializedDimension {
    const { id, name, uri } = this.modelValues();
    return { id, name, $uri: uri };
  }
}

export default ((Dimension: $Cast): Class<Zen.Model<Dimension>>);
