// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  color: string,
  thickness: number,
};

type SerializedGridlinesTheme = DefaultValues;

class GridlinesTheme extends Zen.BaseModel<GridlinesTheme, {}, DefaultValues>
  implements Serializable<SerializedGridlinesTheme> {
  static defaultValues: DefaultValues = {
    color: '#d9d9d9',
    thickness: 1,
  };

  static deserialize(
    values: SerializedGridlinesTheme,
  ): Zen.Model<GridlinesTheme> {
    return GridlinesTheme.create(values);
  }

  serialize(): SerializedGridlinesTheme {
    return {
      color: this._.color(),
      thickness: this._.thickness(),
    };
  }
}

export default ((GridlinesTheme: $Cast): Class<Zen.Model<GridlinesTheme>>);
