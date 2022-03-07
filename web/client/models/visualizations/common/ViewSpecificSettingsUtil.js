// @flow
import * as Zen from 'lib/Zen';
import BarGraphSettings from 'models/visualizations/BarGraph/BarGraphSettings';
import BoxPlotSettings from 'models/visualizations/BoxPlot/BoxPlotSettings';
import BubbleChartSettings from 'models/visualizations/BubbleChart/BubbleChartSettings';
import BumpChartSettings from 'models/visualizations/BumpChart/BumpChartSettings';
import ExpandoTreeSettings from 'models/visualizations/ExpandoTree/ExpandoTreeSettings';
import HeatTilesSettings from 'models/visualizations/HeatTiles/HeatTilesSettings';
import HistogramSettings from 'models/visualizations/Histogram/HistogramSettings';
import LineGraphSettings from 'models/visualizations/LineGraph/LineGraphSettings';
import MapSettings from 'models/visualizations/MapViz/MapSettings';
import NumberTrendSettings from 'models/visualizations/NumberTrend/NumberTrendSettings';
import PieChartSettings from 'models/visualizations/PieChart/PieChartSettings';
import SunburstSettings from 'models/visualizations/Sunburst/SunburstSettings';
import TableSettings from 'models/visualizations/Table/TableSettings';
import type QueryResultGrouping from 'models/core/QueryResultSpec/QueryResultGrouping';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type {
  SerializedViewSpecificSettingsUnion,
  ViewSpecificSettingsUnion,
} from 'models/visualizations/common/types';

/**
 * A utility class for the view-specific settings. Includes things such as
 * generating a visualization's default settings, or serializing/deserializing
 * the settings.
 */
export default class ViewSpecificSettingsUtil {
  /**
   * When a view type is first created, its view-specific settings need to be
   * initialized to some default values. These default values sometimes depend
   * on the fields selected, the groupings, or other information. It varies
   * depending on the ResultViewType being created.
   */
  static createDefaultSettings(
    viewType: ResultViewType,
    fieldIds: $ReadOnlyArray<string>,
    groupings: Zen.Array<QueryResultGrouping>,
    smallMode?: boolean = false,
  ): ViewSpecificSettingsUnion {
    // some control blocks need one of the non-date groupings to use as
    // one of the viz control's initial values
    const groupingDimension = groupings
      .filter(groupBy => groupBy.type() === 'STRING')
      .last()
      .id();

    switch (viewType) {
      case 'MAP':
        return MapSettings.fromConfig({
          groupingDimension,
          smallMode,
          fields: fieldIds,
          isHeatmap: false,
        });
      case 'BAR_GRAPH':
        return BarGraphSettings.fromFieldIds(fieldIds);
      case 'BOX_PLOT':
        return BoxPlotSettings.fromFieldsAndGroupings(fieldIds, groupings);
      case 'BUBBLE_CHART':
        return BubbleChartSettings.fromFieldIds(fieldIds);
      case 'BUMP_CHART':
        return BumpChartSettings.fromFieldIds(fieldIds);
      case 'EPICURVE':
        return HistogramSettings.fromFieldIds(fieldIds);
      case 'EXPANDOTREE':
        return ExpandoTreeSettings.fromFieldIds(fieldIds);
      case 'HEATTILES':
        return HeatTilesSettings.fromFieldIds(fieldIds);
      case 'NUMBER_TREND':
        return NumberTrendSettings.fromFieldIds(fieldIds);
      case 'PIE':
        return PieChartSettings.create({});
      case 'SUNBURST':
        return SunburstSettings.fromFieldIds(fieldIds);
      case 'TABLE':
        return TableSettings.create({});
      case 'TIME':
        return LineGraphSettings.fromFieldIds(fieldIds);
      default:
        throw new Error(
          `[ViewSpecificsettingsUtil] invalid viewType passed to getDefaultControls: ${viewType}`,
        );
    }
  }

  // NOTE(pablo): this function is not type safe. It relies on Zen.cast in order
  // to make things type-check correctly. So you need to make sure you pass the
  // correct `values` object for the `viewType` you're passing - flow will not
  // be able to detect if you're passing the wrong thing. Unfortunately making
  // this type-safe is too difficult because there's no way of creating generic
  // ZenModels, so we have to rely on a large union type.
  static deserialize(
    viewType: ResultViewType,
    values: SerializedViewSpecificSettingsUnion,
  ): ViewSpecificSettingsUnion {
    switch (viewType) {
      case 'MAP':
        return MapSettings.deserialize(
          Zen.cast<Zen.Serialized<MapSettings>>(values),
        );
      case 'BAR_GRAPH':
        return BarGraphSettings.deserialize(
          Zen.cast<Zen.Serialized<BarGraphSettings>>(values),
        );
      case 'BOX_PLOT':
        return BoxPlotSettings.deserialize(
          Zen.cast<Zen.Serialized<BoxPlotSettings>>(values),
        );
      case 'BUBBLE_CHART':
        return BubbleChartSettings.deserialize(
          Zen.cast<Zen.Serialized<BubbleChartSettings>>(values),
        );
      case 'BUMP_CHART':
        return BumpChartSettings.deserialize(
          Zen.cast<Zen.Serialized<BumpChartSettings>>(values),
        );
      case 'EPICURVE':
        return HistogramSettings.deserialize(
          Zen.cast<Zen.Serialized<HistogramSettings>>(values),
        );
      case 'EXPANDOTREE':
        return ExpandoTreeSettings.deserialize(
          Zen.cast<Zen.Serialized<ExpandoTreeSettings>>(values),
        );
      case 'HEATTILES':
        return HeatTilesSettings.deserialize(
          Zen.cast<Zen.Serialized<HeatTilesSettings>>(values),
        );
      case 'NUMBER_TREND':
        return NumberTrendSettings.deserialize(
          Zen.cast<Zen.Serialized<NumberTrendSettings>>(values),
        );
      case 'PIE':
        return PieChartSettings.deserialize(
          Zen.cast<Zen.Serialized<PieChartSettings>>(values),
        );
      case 'SUNBURST':
        return SunburstSettings.deserialize(
          Zen.cast<Zen.Serialized<SunburstSettings>>(values),
        );
      case 'TABLE':
        return TableSettings.deserialize(
          Zen.cast<Zen.Serialized<TableSettings>>(values),
        );
      case 'TIME':
        return LineGraphSettings.deserialize(
          Zen.cast<Zen.Serialized<LineGraphSettings>>(values),
        );
      default:
        throw new Error(
          `[ViewSpecificsettingsUtil] invalid viewType passed to getDefaultControls: ${viewType}`,
        );
    }
  }
}
