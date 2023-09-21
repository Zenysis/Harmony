// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  alignment: 'left' | 'center' | 'right',
  // NOTE: width ratio is only used when useFixedColumnWidthRatios in
  // TableStyleTheme is turned on.
  widthRatio: number,
};

type SerializedColumnTheme = DefaultValues;

class ColumnTheme extends Zen.BaseModel<ColumnTheme, {}, DefaultValues>
  implements Serializable<SerializedColumnTheme> {
  static defaultValues: DefaultValues = {
    alignment: 'left',
    widthRatio: 1,
  };

  static createAsPerColumnTheme(
    values: $Shape<DefaultValues>,
  ): {
    isPerColumn: false,
    value: Zen.Model<ColumnTheme>,
  } {
    return {
      isPerColumn: false,
      value: ColumnTheme.create(values),
    };
  }

  static deserialize(values: SerializedColumnTheme): Zen.Model<ColumnTheme> {
    return ColumnTheme.create(values);
  }

  serialize(): SerializedColumnTheme {
    return {
      alignment: this._.alignment(),
      widthRatio: this._.widthRatio(),
    };
  }
}

export default ((ColumnTheme: $Cast): Class<Zen.Model<ColumnTheme>>);
