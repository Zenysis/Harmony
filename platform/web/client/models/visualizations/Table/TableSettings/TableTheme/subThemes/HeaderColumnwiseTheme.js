// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  backgroundColor: string | null,
  boldText: boolean,
  rotateHeader: boolean,
  textColor: string,
  textFont: string,
  textSize: number,
};

type SerializedHeaderColumnwiseTheme = DefaultValues;

class HeaderColumnwiseTheme
  extends Zen.BaseModel<HeaderColumnwiseTheme, {}, DefaultValues>
  implements Serializable<SerializedHeaderColumnwiseTheme> {
  static defaultValues: DefaultValues = {
    backgroundColor: null,
    boldText: true,
    rotateHeader: false,
    textColor: '#4E4E4E',
    textFont: 'Arial',
    textSize: 13,
  };

  static createAsPerColumnTheme(
    values: $Shape<DefaultValues>,
  ): {
    isPerColumn: false,
    value: Zen.Model<HeaderColumnwiseTheme>,
  } {
    return {
      isPerColumn: false,
      value: HeaderColumnwiseTheme.create(values),
    };
  }

  static deserialize(
    values: SerializedHeaderColumnwiseTheme,
  ): Zen.Model<HeaderColumnwiseTheme> {
    return HeaderColumnwiseTheme.create(values);
  }

  serialize(): SerializedHeaderColumnwiseTheme {
    return {
      backgroundColor: this._.backgroundColor(),
      boldText: this._.boldText(),
      rotateHeader: this._.rotateHeader(),
      textColor: this._.textColor(),
      textFont: this._.textFont(),
      textSize: this._.textSize(),
    };
  }
}

export default ((HeaderColumnwiseTheme: $Cast): Class<
  Zen.Model<HeaderColumnwiseTheme>,
>);
