// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  alignment: 'left' | 'center' | 'right',
  // NOTE(david): width ratio is only used when useFixedColumnWidthRatios in
  // TableStyleTheme is turned on. Right now that setting is not exposed to the
  // user and is only on for the KVAP KP_TRACKING theme
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
