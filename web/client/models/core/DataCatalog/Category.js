// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type Values = {
  id: string,
  name: string,
  uri: string,
};

type SerializedCategory = {
  id: string,
  name: string,
  $uri: string,
};

/**
 * Category class for indicator management.
 */
class Category extends Zen.BaseModel<Category, Values>
  implements Serializable<SerializedCategory> {
  static deserialize(values: SerializedCategory): Zen.Model<Category> {
    const { id, name, $uri } = values;
    return Category.create({ id, name, uri: $uri });
  }

  serialize(): SerializedCategory {
    const { id, name, uri } = this.modelValues();
    return { id, name, $uri: uri };
  }
}

export default ((Category: $Cast): Class<Zen.Model<Category>>);
