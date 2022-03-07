// @flow
import BarGraphQueryResultState from 'models/visualizations/BarGraph/BarGraphQueryResultState';
import BoxPlotQueryResultState from 'models/visualizations/BoxPlot/BoxPlotQueryResultState';
import BubbleChartQueryResultState from 'models/visualizations/BubbleChart/BubbleChartQueryResultState';
import BumpChartQueryResultState from 'models/visualizations/BumpChart/BumpChartQueryResultState';
import ExpandoTreeQueryResultState from 'models/visualizations/ExpandoTree/ExpandoTreeQueryResultState';
import HeatTilesQueryResultState from 'models/visualizations/HeatTiles/HeatTilesQueryResultState';
import HistogramQueryResultState from 'models/visualizations/Histogram/HistogramQueryResultState';
import LineGraphQueryResultState from 'models/visualizations/LineGraph/LineGraphQueryResultState';
import MapQueryResultState from 'models/visualizations/MapViz/MapQueryResultState';
import NumberTrendQueryResultState from 'models/visualizations/NumberTrend/NumberTrendQueryResultState';
import PieChartQueryResultState from 'models/visualizations/PieChart/PieChartQueryResultState';
import SunburstQueryResultState from 'models/visualizations/Sunburst/SunburstQueryResultState';
import TableQueryResultState from 'models/visualizations/Table/TableQueryResultState';

// QueryResultState models that can process the AQT QuerySelections type used
// by the AQT query form.
// eslint-disable-next-line import/prefer-default-export
export const AQT_QUERY_RESULT_STATES: {
  BAR_GRAPH: typeof BarGraphQueryResultState,
  BOX_PLOT: typeof BoxPlotQueryResultState,
  BUMP_CHART: typeof BumpChartQueryResultState,
  BUBBLE_CHART: typeof BubbleChartQueryResultState,
  EPICURVE: typeof HistogramQueryResultState,
  EXPANDOTREE: typeof ExpandoTreeQueryResultState,
  HEATTILES: typeof HeatTilesQueryResultState,
  MAP: typeof MapQueryResultState,
  NUMBER_TREND: typeof NumberTrendQueryResultState,
  PIE: typeof PieChartQueryResultState,
  SUNBURST: typeof SunburstQueryResultState,
  TABLE: typeof TableQueryResultState,
  TIME: typeof LineGraphQueryResultState,
} = {
  BAR_GRAPH: BarGraphQueryResultState,
  BOX_PLOT: BoxPlotQueryResultState,
  BUMP_CHART: BumpChartQueryResultState,
  BUBBLE_CHART: BubbleChartQueryResultState,
  EXPANDOTREE: ExpandoTreeQueryResultState,
  HEATTILES: HeatTilesQueryResultState,
  EPICURVE: HistogramQueryResultState,
  MAP: MapQueryResultState,
  NUMBER_TREND: NumberTrendQueryResultState,
  PIE: PieChartQueryResultState,
  SUNBURST: SunburstQueryResultState,
  TABLE: TableQueryResultState,
  TIME: LineGraphQueryResultState,
};
