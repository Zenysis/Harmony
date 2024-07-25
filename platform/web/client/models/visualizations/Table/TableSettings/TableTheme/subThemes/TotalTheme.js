// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  backgroundColor: string | null,
  boldText: boolean,
  textColor: string,
  textFont: string,
  textSize: number,
};

type SerializedTotalTheme = DefaultValues;

class TotalTheme extends Zen.BaseModel<TotalTheme, {}, DefaultValues>
  implements Serializable<SerializedTotalTheme> {
  static defaultValues: DefaultValues = {
    backgroundColor: 'white',
    boldText: true,
    textColor: 'black',
    textFont: 'Arial',
    textSize: 13,
  };

  static deserialize(values: SerializedTotalTheme): Zen.Model<TotalTheme> {
    return TotalTheme.create(values);
  }

  serialize(): SerializedTotalTheme {
    return {
      backgroundColor: this._.backgroundColor(),
      boldText: this._.boldText(),
      textColor: this._.textColor(),
      textFont: this._.textFont(),
      textSize: this._.textSize(),
    };
  }
}

export default ((TotalTheme: $Cast): Class<Zen.Model<TotalTheme>>);
