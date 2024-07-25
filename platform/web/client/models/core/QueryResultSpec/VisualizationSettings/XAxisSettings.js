// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

export type DefaultXAxisValues = {
  additionalAxisTitleDistance: string,
  labelsFontColor: string,
  labelsFontFamily: string,
  labelsFontSize: string,
  title: string,
  titleFontColor: string,
  titleFontFamily: string,
  titleFontSize: string,
};

export type SerializedXAxis = {
  additionalAxisTitleDistance?: string,
  labelsFontColor?: string,
  labelsFontFamily?: string,
  labelsFontSize?: string,
  title?: string,
  titleFontColor?: string,
  titleFontFamily?: string,
  titleFontSize?: string,
};

class XAxisSettings extends Zen.BaseModel<XAxisSettings, {}, DefaultXAxisValues>
  implements Serializable<SerializedXAxis> {
  static defaultValues: DefaultXAxisValues = {
    additionalAxisTitleDistance: '0px',
    labelsFontColor: 'black',
    labelsFontFamily: 'Arial',
    labelsFontSize: '13px',
    title: '',
    titleFontColor: 'black',
    titleFontFamily: 'Arial',
    titleFontSize: '13px',
  };

  static deserialize(modelValues: SerializedXAxis): Zen.Model<XAxisSettings> {
    return XAxisSettings.create({ ...modelValues });
  }

  serialize(): SerializedXAxis {
    return { ...this.modelValues() };
  }
}

export default ((XAxisSettings: $Cast): Class<Zen.Model<XAxisSettings>>);
