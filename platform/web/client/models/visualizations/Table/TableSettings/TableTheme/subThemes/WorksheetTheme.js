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

type SerializedWorksheetTheme = DefaultValues;

class WorksheetTheme extends Zen.BaseModel<WorksheetTheme, {}, DefaultValues>
  implements Serializable<SerializedWorksheetTheme> {
  static defaultValues: DefaultValues = {
    backgroundColor: null,
    boldText: false,
    textColor: 'black',
    textFont: 'Arial',
    textSize: 13,
  };

  static createAsPerColumnTheme(
    values: $Shape<DefaultValues>,
  ): {
    isPerColumn: false,
    value: Zen.Model<WorksheetTheme>,
  } {
    return {
      isPerColumn: false,
      value: WorksheetTheme.create(values),
    };
  }

  static deserialize(
    values: SerializedWorksheetTheme,
  ): Zen.Model<WorksheetTheme> {
    return WorksheetTheme.create(values);
  }

  serialize(): SerializedWorksheetTheme {
    return {
      backgroundColor: this._.backgroundColor(),
      boldText: this._.boldText(),
      textColor: this._.textColor(),
      textFont: this._.textFont(),
      textSize: this._.textSize(),
    };
  }
}

export default ((WorksheetTheme: $Cast): Class<Zen.Model<WorksheetTheme>>);
