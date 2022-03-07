// @flow
import * as Zen from 'lib/Zen';
import AxesSettings from 'models/core/QueryResultSpec/VisualizationSettings/AxesSettings';
import LegendSettings from 'models/core/QueryResultSpec/VisualizationSettings/LegendSettings';
import SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import ViewSpecificSettingsUtil from 'models/visualizations/common/ViewSpecificSettingsUtil';
import getSettingRequirements from 'models/core/QueryResultSpec/VisualizationSettings/getSettingRequirements';
import type QueryResultGrouping from 'models/core/QueryResultSpec/QueryResultGrouping';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { Serializable } from 'lib/Zen';
import type {
  SerializedViewSpecificSettingsUnion,
  ViewSpecificSettingsUnion,
} from 'models/visualizations/common/types';

type RequiredValues = {
  seriesSettings: SeriesSettings,
  viewSpecificSettings: ViewSpecificSettingsUnion,
  viewType: ResultViewType,
};

type DefaultValues = {
  axesSettings: AxesSettings | void,
  legendSettings: LegendSettings | void,
};

type SerializedVisualizationSettings = {
  seriesSettings: Zen.Serialized<SeriesSettings>,
  axesSettings?: Zen.Serialized<AxesSettings>,
  legendSettings?: Zen.Serialized<LegendSettings>,
  viewSpecificSettings: SerializedViewSpecificSettingsUnion,
};

export type ViewTypeConfig = {
  // TODO(stephen, pablo): Rename this to fieldIds to be consistent.
  fields: $ReadOnlyArray<string>,
  groupingDimension: string,
  groupings: Zen.Array<QueryResultGrouping>,
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
  static defaultValues: DefaultValues = {
    axesSettings: undefined,
    legendSettings: undefined,
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

    const { needsAxesSettings, needsLegendSettings } = getSettingRequirements(
      viewType,
    );
    return VisualizationSettings.create({
      viewType,
      viewSpecificSettings: ViewSpecificSettingsUtil.deserialize(
        viewType,
        viewSpecificSettings,
      ),
      seriesSettings: SeriesSettings.deserialize(seriesSettings),
      axesSettings:
        needsAxesSettings && axesSettings
          ? AxesSettings.deserialize(axesSettings)
          : undefined,
      legendSettings:
        needsLegendSettings && legendSettings
          ? LegendSettings.deserialize(legendSettings)
          : undefined,
    });
  }

  updateVisualizationControlValue(
    controlKey: any,
    value: any,
  ): Zen.Model<VisualizationSettings> {
    const viewSpecificSettings = this._.viewSpecificSettings();
    if (viewSpecificSettings) {
      const newViewSpecificSettings = viewSpecificSettings.set(
        controlKey,
        value,
      );
      return this._.viewSpecificSettings(newViewSpecificSettings);
    }
    return this._;
  }

  serialize(): SerializedVisualizationSettings {
    const {
      axesSettings,
      legendSettings,
      seriesSettings,
      viewSpecificSettings,
      viewType,
    } = this.modelValues();

    const { needsAxesSettings, needsLegendSettings } = getSettingRequirements(
      viewType,
    );

    return {
      viewSpecificSettings: viewSpecificSettings.serialize(),
      axesSettings:
        needsAxesSettings && axesSettings
          ? axesSettings.serialize()
          : undefined,
      legendSettings:
        needsLegendSettings && legendSettings
          ? legendSettings.serialize()
          : undefined,
      seriesSettings: seriesSettings.serialize(),
    };
  }
}

export default ((VisualizationSettings: $Cast): Class<
  Zen.Model<VisualizationSettings>,
>);
