// @flow
import * as Zen from 'lib/Zen';
import XAxisSettings from 'models/core/QueryResultSpec/VisualizationSettings/XAxisSettings';
import type { DefaultXAxisValues } from 'models/core/QueryResultSpec/VisualizationSettings/XAxisSettings';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  ...DefaultXAxisValues,
  rangeFrom: number | void,
  rangeTo: number | void,
};

export type SerializedYAxis = {
  ...Zen.Serialized<XAxisSettings>,
  rangeFrom?: number,
  rangeTo?: number,
};

class YAxisSettings extends Zen.BaseModel<YAxisSettings, {}, DefaultValues>
  implements Serializable<SerializedYAxis> {
  static defaultValues: DefaultValues = {
    additionalAxisTitleDistance: '0px',
    labelsFontColor: 'black',
    labelsFontFamily: 'Arial',
    labelsFontSize: '13px',
    rangeFrom: undefined,
    rangeTo: undefined,
    title: '',
    titleFontColor: 'black',
    titleFontFamily: 'Arial',
    titleFontSize: '13px',
  };

  static deserialize(modelValues: SerializedYAxis): Zen.Model<YAxisSettings> {
    return YAxisSettings.create({ ...modelValues });
  }

  serialize(): SerializedYAxis {
    return { ...this.modelValues() };
  }
}

export default ((YAxisSettings: $Cast): Class<Zen.Model<YAxisSettings>>);
