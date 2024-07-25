// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  backgroundColor: string | null,
  borderColor: string | null,
  roundCorners: boolean,
  rowBandingColor: string | null,
  // NOTE: This setting is currently not exposed anywhere.
  useFixedColumnWidthRatios: boolean,
};

type SerializedTableStyleTheme = DefaultValues;

class TableStyleTheme extends Zen.BaseModel<TableStyleTheme, {}, DefaultValues>
  implements Serializable<SerializedTableStyleTheme> {
  static defaultValues: DefaultValues = {
    backgroundColor: null,
    borderColor: null,
    roundCorners: true,
    rowBandingColor: '#f0f0f0',
    useFixedColumnWidthRatios: false,
  };

  static deserialize(
    values: SerializedTableStyleTheme,
  ): Zen.Model<TableStyleTheme> {
    return TableStyleTheme.create(values);
  }

  serialize(): SerializedTableStyleTheme {
    return {
      backgroundColor: this._.backgroundColor(),
      borderColor: this._.borderColor(),
      roundCorners: this._.roundCorners(),
      rowBandingColor: this._.rowBandingColor(),
      useFixedColumnWidthRatios: this._.useFixedColumnWidthRatios(),
    };
  }
}

export default ((TableStyleTheme: $Cast): Class<Zen.Model<TableStyleTheme>>);
