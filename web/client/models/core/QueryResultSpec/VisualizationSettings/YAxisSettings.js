// @flow
import * as Zen from 'lib/Zen';
import XAxisSettings from 'models/core/QueryResultSpec/VisualizationSettings/XAxisSettings';
import type { DefaultXAxisValues } from 'models/core/QueryResultSpec/VisualizationSettings/XAxisSettings';
import type { Serializable } from 'lib/Zen';

type DefaultValues = $Merge<
  DefaultXAxisValues,
  {
    rangeFrom: number | void,
    rangeTo: number | void,
  },
>;

type SerializedYAxis = $Merge<
  Zen.Serialized<XAxisSettings>,
  {
    rangeFrom?: number,
    rangeTo?: number,
  },
>;

class YAxisSettings extends Zen.BaseModel<YAxisSettings, {}, DefaultValues>
  implements Serializable<SerializedYAxis> {
  static defaultValues = {
    ...XAxisSettings.defaultValues,
    rangeFrom: undefined,
    rangeTo: undefined,
  };

  static deserialize(
    modelValues?: SerializedYAxis = {},
  ): Zen.Model<YAxisSettings> {
    return YAxisSettings.create({ ...modelValues });
  }

  serialize(): SerializedYAxis {
    return { ...this.modelValues() };
  }
}

export default ((YAxisSettings: any): Class<Zen.Model<YAxisSettings>>);
