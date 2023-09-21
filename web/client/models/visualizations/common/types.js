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
import type { ResultViewType } from 'components/QueryResult/viewTypes';

type ViewSpecificSettingsMap = {
  BAR_GRAPH: BarGraphSettings,
  BOX_PLOT: BoxPlotSettings,
  BUBBLE_CHART: BubbleChartSettings,
  BUMP_CHART: BumpChartSettings,
  EPICURVE: HistogramSettings,
  EXPANDOTREE: ExpandoTreeSettings,
  HEATTILES: HeatTilesSettings,
  MAP: MapSettings,
  NUMBER_TREND: NumberTrendSettings,
  PIE: PieChartSettings,
  SUNBURST: SunburstSettings,
  TABLE: TableSettings,
  TIME: LineGraphSettings,
};

export type SerializedViewSpecificSettingsUnion =
  | Zen.Serialized<BarGraphSettings>
  | Zen.Serialized<BoxPlotSettings>
  | Zen.Serialized<BubbleChartSettings>
  | Zen.Serialized<BumpChartSettings>
  | Zen.Serialized<HistogramSettings>
  | Zen.Serialized<ExpandoTreeSettings>
  | Zen.Serialized<HeatTilesSettings>
  | Zen.Serialized<MapSettings>
  | Zen.Serialized<NumberTrendSettings>
  | Zen.Serialized<PieChartSettings>
  | Zen.Serialized<SunburstSettings>
  | Zen.Serialized<TableSettings>
  | Zen.Serialized<LineGraphSettings>;

export type ViewSpecificSettingsUnion = $Values<ViewSpecificSettingsMap>;

export type ViewSpecificSettings<ViewType: ResultViewType> = $ElementType<
  ViewSpecificSettingsMap,
  ViewType,
>;
