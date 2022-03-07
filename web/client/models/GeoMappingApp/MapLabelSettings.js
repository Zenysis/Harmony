// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {};

type DefaultValues = {
  /** List of properties (with corresponding values to show on the label */
  selectedPropertiesToDisplay: $ReadOnlyArray<string>,

  /** Hide/show label for all markers on this layer */
  show: boolean,

  /** Styling properties */
  tooltipBackgroundColor: {| r: number, g: number, b: number, a?: number |},
  tooltipBold: boolean,
  tooltipFontColor: string,
  tooltipFontFamily: string,
  tooltipFontSize: string,
};

type SerializedMapLabelSettings = {
  selectedPropertiesToDisplay: $ReadOnlyArray<string>,
  show: boolean,
  tooltipBackgroundColor: {| r: number, g: number, b: number, a?: number |},
  tooltipBold: boolean,
  tooltipFontColor: string,
  tooltipFontFamily: string,
  tooltipFontSize: string,
};

/**
 * The MapLabelSettings ZenModel is responsible for holding and persisting
 * style settings for labels given a particular layer.
 */
class MapLabelSettings
  extends Zen.BaseModel<MapLabelSettings, RequiredValues, DefaultValues>
  implements Serializable<SerializedMapLabelSettings> {
  static defaultValues: DefaultValues = {
    selectedPropertiesToDisplay: [],
    show: false,
    tooltipBackgroundColor: { r: 255, g: 255, b: 255, a: 0.75 },
    tooltipBold: false,
    tooltipFontColor: 'black',
    tooltipFontFamily: 'Arial',
    tooltipFontSize: '12px',
  };

  static deserialize(
    values: SerializedMapLabelSettings,
  ): Zen.Model<MapLabelSettings> {
    return MapLabelSettings.create({ ...values });
  }

  serialize(): SerializedMapLabelSettings {
    return {
      selectedPropertiesToDisplay: this._.selectedPropertiesToDisplay(),
      show: this._.show(),
      tooltipBackgroundColor: this._.tooltipBackgroundColor(),
      tooltipBold: this._.tooltipBold(),
      tooltipFontColor: this._.tooltipFontColor(),
      tooltipFontFamily: this._.tooltipFontFamily(),
      tooltipFontSize: this._.tooltipFontSize(),
    };
  }
}

export default ((MapLabelSettings: $Cast): Class<Zen.Model<MapLabelSettings>>);
