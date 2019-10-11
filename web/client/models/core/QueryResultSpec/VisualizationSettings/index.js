// @flow
import * as Zen from 'lib/Zen';
import AxesSettings from 'models/core/QueryResultSpec/VisualizationSettings/AxesSettings';
import LegendSettings from 'models/core/QueryResultSpec/VisualizationSettings/LegendSettings';
import SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  seriesSettings: SeriesSettings,
  viewType: ResultViewType,
};

type DefaultValues = {
  axesSettings: AxesSettings | void,
  legendSettings: LegendSettings | void,
  viewSpecificSettings: {
    // TODO(pablo): create a VisualizationControls model for each viz
    [viewType: ResultViewType]: { [string]: mixed },
  } | void,
};

type SerializedVisualizationSettings = {
  seriesSettings: Zen.Serialized<SeriesSettings>,
  axesSettings?: Zen.Serialized<AxesSettings>,
  legendSettings?: Zen.Serialized<LegendSettings>,
  viewSpecificSettings?: {},
};

export type ViewTypeConfig = {
  // TODO(stephen, pablo): Rename this to fieldIds to be consistent.
  fields: $ReadOnlyArray<string>,
  groupingDimension: string,
  smallMode: boolean,
};

/**
 * VisualizationSettings represents the settings that are specific to a
 * visualization. As opposed to TitleSettings which represents metadata
 * applicable to the *entire* QueryResultSpec, VisualizationSettings is
 * metadata applicable only to a specific visualization (a `viewType`).
 *
 * This is why the QueryResultSpec holds a map of VisualizationSettings.
 * It needs to hold one per viewType that it supports.
 */
class VisualizationSettings
  extends Zen.BaseModel<VisualizationSettings, RequiredValues, DefaultValues>
  implements Serializable<SerializedVisualizationSettings> {
  static defaultValues = {
    axesSettings: undefined,
    legendSettings: undefined,
    viewSpecificSettings: undefined,
  };

  static deserialize(
    values: SerializedVisualizationSettings,
    extraConfig: { viewType: ResultViewType },
  ): Zen.Model<VisualizationSettings> {
    const {
      axesSettings,
      legendSettings,
      seriesSettings,
      viewSpecificSettings,
    } = values;
    const { viewType } = extraConfig;

    return VisualizationSettings.create({
      viewType,
      viewSpecificSettings,
      seriesSettings: SeriesSettings.deserialize(seriesSettings),
      axesSettings: axesSettings
        ? AxesSettings.deserialize(axesSettings)
        : undefined,
      legendSettings: legendSettings
        ? LegendSettings.deserialize(legendSettings)
        : undefined,
    });
  }

  updateVisualizationControlValue(
    controlKey: string,
    value: any,
  ): Zen.Model<VisualizationSettings> {
    const newControls = {
      ...this._.viewSpecificSettings(),
      [controlKey]: value,
    };
    return this._.viewSpecificSettings(newControls);
  }

  serialize(): SerializedVisualizationSettings {
    const {
      axesSettings,
      legendSettings,
      seriesSettings,
      viewSpecificSettings,
    } = this.modelValues();
    return {
      viewSpecificSettings,
      axesSettings: axesSettings ? axesSettings.serialize() : undefined,
      legendSettings: legendSettings ? legendSettings.serialize() : undefined,
      seriesSettings: seriesSettings.serialize(),
    };
  }
}

export default ((VisualizationSettings: any): Class<
  Zen.Model<VisualizationSettings>,
>);
