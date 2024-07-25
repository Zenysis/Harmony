// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type Values = {
  calculation: string,
  id: string,
  name: string,
  shortName: string,
  uri: string,
};

type SerializedField = {
  $uri: string,
  calculation: string,
  id: string,
  name: string,
  shortName: string,
};

/**
 * Field class for indicator management. Field models will no longer include
 * references to its dimensions, categories, and data sources. Those will can
 * be retrieved through a separate api call.
 */
class Field extends Zen.BaseModel<Field, Values>
  implements Serializable<SerializedField> {
  static deserialize(values: SerializedField): Zen.Model<Field> {
    const { $uri, calculation, id, name, shortName } = values;
    return Field.create({ calculation, id, name, shortName, uri: $uri });
  }

  serialize(): SerializedField {
    const { calculation, id, name, shortName, uri } = this.modelValues();
    return { calculation, id, name, shortName, $uri: uri };
  }
}

export default ((Field: $Cast): Class<Zen.Model<Field>>);
