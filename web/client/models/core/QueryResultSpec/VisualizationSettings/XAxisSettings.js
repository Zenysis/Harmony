// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

export type DefaultXAxisValues = {
  goalLine: string,
  goalLineLabel: string,
  goalLineFontSize: string,
  goalLineColor: string,
  goalLineThickness: string,
  goalLineStyle: string,
  labelsFontSize: string,
  labelsFontColor: string,
  labelsFontFamily: string,
  title: string,
  titleFontSize: string,
  titleFontColor: string,
  titleFontFamily: string,
  additionalAxisTitleDistance: string,
};

type SerializedXAxis = {
  goalLine?: string,
  goalLineLabel?: string,
  goalLineFontSize?: string,
  goalLineColor?: string,
  goalLineThickness?: string,
  goalLineStyle?: string,
  labelsFontSize?: string,
  labelsFontColor?: string,
  title?: string,
  titleFontSize?: string,
  titleFontColor?: string,
  labelsFontFamily?: string,
  titleFontFamily?: string,
  additionalAxisTitleDistance?: string,
};

class XAxisSettings extends Zen.BaseModel<XAxisSettings, {}, DefaultXAxisValues>
  implements Serializable<SerializedXAxis> {
  static defaultValues = {
    goalLine: '',
    goalLineLabel: '',
    goalLineFontSize: '14px',
    goalLineColor: 'black',
    goalLineThickness: '1',
    goalLineStyle: 'Solid',
    labelsFontSize: '16px',
    labelsFontColor: 'black',
    labelsFontFamily: 'Arial',
    title: '',
    titleFontSize: '18px',
    titleFontColor: 'black',
    titleFontFamily: 'Arial',
    additionalAxisTitleDistance: '0px',
  };

  static deserialize(
    modelValues?: SerializedXAxis = {},
  ): Zen.Model<XAxisSettings> {
    return XAxisSettings.create({ ...modelValues });
  }

  serialize(): SerializedXAxis {
    return { ...this.modelValues() };
  }
}

export default ((XAxisSettings: any): Class<Zen.Model<XAxisSettings>>);
