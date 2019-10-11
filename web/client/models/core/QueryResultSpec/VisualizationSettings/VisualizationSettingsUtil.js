// @flow
import * as Zen from 'lib/Zen';
import AxesSettings from 'models/core/QueryResultSpec/VisualizationSettings/AxesSettings';
import LegendSettings from 'models/core/QueryResultSpec/VisualizationSettings/LegendSettings';
import SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import VisualizationSettings from 'models/core/QueryResultSpec/VisualizationSettings';
import { RESULT_VIEW_CONTROLS_BLOCKS } from 'components/QueryResult/registry/resultViewControlBlocks';
import type LegacyField from 'models/core/Field';
import type QueryResultGrouping from 'models/core/QueryResultSpec/QueryResultGrouping';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

function getDefaultControls(
  viewType: ResultViewType,
  fieldIds: $ReadOnlyArray<string>,
  groupings: Zen.Array<QueryResultGrouping>,
  smallMode: boolean = false,
) {
  const ControlsBlock = RESULT_VIEW_CONTROLS_BLOCKS[viewType];

  // some control blocks need one of the non-date groupings to use as
  // one of the viz control's initial values
  const groupingDimension = groupings
    .filter(groupBy => groupBy.type() === 'STRING')
    .last()
    .id();
  const newConfig = {
    groupingDimension,
    smallMode,
    fields: fieldIds,
  };
  return ControlsBlock ? ControlsBlock.getDefaultControls(newConfig) : {};
}

export default class VisualizationSettingsUtil {
  static fromViewType(
    viewType: ResultViewType,
    fields: $ReadOnlyArray<LegacyField>,
    groupings: Zen.Array<QueryResultGrouping>,
    smallMode: boolean = false,
  ): VisualizationSettings {
    const defaultControls = getDefaultControls(
      viewType,
      fields.map(f => f.id()),
      groupings,
      smallMode,
    );
    return VisualizationSettings.create({
      viewType,
      axesSettings: AxesSettings.fromViewType(viewType),
      legendSettings: LegendSettings.fromViewType(viewType),
      seriesSettings: SeriesSettings.fromFields(fields),
      viewSpecificSettings: defaultControls,
    });
  }

  /**
   * Create a new VisualizationSettings instance based off an existing instance
   * for a different ResultViewType. This utility is useful when we need to
   * create the settings for a ResultViewType but do not have all information.
   * An example is when a new ResultViewType is added. In this case, we might
   * deserialize an existing QueryResultSpec and set up the viewTypes to include
   * the new visualization. Unfortunately, we would not have the
   * VisualizationSettings for the new type at that time, and we would not have
   * the values needed to call `fromViewType` because we are deserializing.
   *
   * NOTE(stephen): There is a dependency on having the QueryResultGroupings
   * available. This is ok right now, since the users of this method all have
   * access to it. However, it is a somewhat annoying limitation to have.
   */
  static castToNewViewType(
    currentSettings: VisualizationSettings,
    viewType: ResultViewType,
    groupings: Zen.Array<QueryResultGrouping>,
    smallMode: boolean = false,
  ): VisualizationSettings {
    if (currentSettings.viewType() === viewType) {
      return currentSettings;
    }

    // Use the current SeriesSettings since we do not have access to the
    // original `Field`s it was instantiated from. This is an ok compromise.
    const seriesSettings = currentSettings.seriesSettings();

    return VisualizationSettings.create({
      seriesSettings,
      viewType,
      axesSettings: AxesSettings.fromViewType(viewType),
      legendSettings: LegendSettings.fromViewType(viewType),
      viewSpecificSettings: getDefaultControls(
        viewType,
        seriesSettings.seriesOrder(),
        groupings,
        smallMode,
      ),
    });
  }
}
