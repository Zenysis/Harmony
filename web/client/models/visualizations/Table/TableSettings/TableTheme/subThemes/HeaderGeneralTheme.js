// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  displayHeaderLine: boolean,
  headerLineColor: string,
  headerLineThickness: number,
};

type SerializedHeaderGeneralTheme = DefaultValues;

class HeaderGeneralTheme
  extends Zen.BaseModel<HeaderGeneralTheme, {}, DefaultValues>
  implements Serializable<SerializedHeaderGeneralTheme> {
  static defaultValues: DefaultValues = {
    displayHeaderLine: true,
    headerLineColor: '#d9d9d9',
    headerLineThickness: 2,
  };

  static deserialize(
    values: SerializedHeaderGeneralTheme,
  ): Zen.Model<HeaderGeneralTheme> {
    return HeaderGeneralTheme.create(values);
  }

  serialize(): SerializedHeaderGeneralTheme {
    return {
      displayHeaderLine: this._.displayHeaderLine(),
      headerLineColor: this._.headerLineColor(),
      headerLineThickness: this._.headerLineThickness(),
    };
  }
}

export default ((HeaderGeneralTheme: $Cast): Class<
  Zen.Model<HeaderGeneralTheme>,
>);
