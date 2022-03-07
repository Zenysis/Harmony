// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  displayHeaderLine: boolean,
  headerLineThickness: number,
  headerLineColor: string,
};

type SerializedHeaderGeneralTheme = DefaultValues;

class HeaderGeneralTheme
  extends Zen.BaseModel<HeaderGeneralTheme, {}, DefaultValues>
  implements Serializable<SerializedHeaderGeneralTheme> {
  static defaultValues: DefaultValues = {
    displayHeaderLine: true,
    headerLineThickness: 2,
    headerLineColor: '#d9d9d9',
  };

  static deserialize(
    values: SerializedHeaderGeneralTheme,
  ): Zen.Model<HeaderGeneralTheme> {
    return HeaderGeneralTheme.create(values);
  }

  serialize(): SerializedHeaderGeneralTheme {
    return {
      displayHeaderLine: this._.displayHeaderLine(),
      headerLineThickness: this._.headerLineThickness(),
      headerLineColor: this._.headerLineColor(),
    };
  }
}

export default ((HeaderGeneralTheme: $Cast): Class<
  Zen.Model<HeaderGeneralTheme>,
>);
