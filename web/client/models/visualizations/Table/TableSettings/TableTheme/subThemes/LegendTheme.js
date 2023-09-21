// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  boldText: boolean,
  consolidateRules: boolean,
  showLegend: boolean,
  textColor: string,
  textFont: string,
  textSize: string,
};

type SerializedLegendTheme = DefaultValues;

class LegendTheme extends Zen.BaseModel<LegendTheme, {}, DefaultValues>
  implements Serializable<SerializedLegendTheme> {
  static defaultValues: DefaultValues = {
    boldText: false,
    consolidateRules: false,
    showLegend: false,
    textColor: 'black',
    textFont: 'Arial',
    textSize: '13px',
  };

  static deserialize(values: SerializedLegendTheme): Zen.Model<LegendTheme> {
    return LegendTheme.create(values);
  }

  serialize(): SerializedLegendTheme {
    return {
      boldText: this._.boldText(),
      consolidateRules: this._.consolidateRules(),
      showLegend: this._.showLegend(),
      textColor: this._.textColor(),
      textFont: this._.textFont(),
      textSize: this._.textSize(),
    };
  }
}

export default ((LegendTheme: $Cast): Class<Zen.Model<LegendTheme>>);
