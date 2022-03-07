// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type Values = {
  id: string,
  calculation: string,
  name: string,
  shortName: string,
  uri: string,
};

type SerializedField = {
  id: string,
  calculation: string,
  name: string,
  shortName: string,
  $uri: string,
};

/**
 * Field class for indicator management. Field models will no longer include
 * references to its dimensions, categories, and data sources. Those will can
 * be retrieved through a separate api call.
 */
class Field extends Zen.BaseModel<Field, Values>
  implements Serializable<SerializedField> {
  static deserialize(values: SerializedField): Zen.Model<Field> {
    const { id, calculation, name, shortName, $uri } = values;
    return Field.create({ id, calculation, name, shortName, uri: $uri });
  }

  serialize(): SerializedField {
    const { id, calculation, name, shortName, uri } = this.modelValues();
    return { id, calculation, name, shortName, $uri: uri };
  }
}

export default ((Field: $Cast): Class<Zen.Model<Field>>);
