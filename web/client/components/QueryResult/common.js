// @noflow
import BarGraph from 'components/visualizations/BarGraph';
import BoxPlot from 'components/visualizations/BoxPlot';
import BubbleChart from 'components/visualizations/BubbleChart';
import BumpChart from 'components/visualizations/BumpChart';
import ExpandoTree from 'components/visualizations/ExpandoTree';
import HeatTiles from 'components/visualizations/HeatTiles';
import Histogram from 'components/visualizations/Histogram';
import LineGraph from 'components/visualizations/LineGraph';
import MapViz from 'components/visualizations/MapViz';
import NumberTrend from 'components/visualizations/NumberTrend';
import PieChart from 'components/visualizations/PieChart';
import Sunburst from 'components/visualizations/Sunburst';
import Table from 'components/visualizations/Table/TableWrapper';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/viewTypes';

export const RESULT_VIEW_COMPONENTS = {
  [RESULT_VIEW_TYPES.BAR_GRAPH]: BarGraph,
  [RESULT_VIEW_TYPES.TIME]: LineGraph,
  [RESULT_VIEW_TYPES.BOX_PLOT]: BoxPlot,
  [RESULT_VIEW_TYPES.TABLE]: Table,
  [RESULT_VIEW_TYPES.MAP]: MapViz,
  [RESULT_VIEW_TYPES.HEATTILES]: HeatTiles,
  [RESULT_VIEW_TYPES.BUBBLE_CHART]: BubbleChart,
  [RESULT_VIEW_TYPES.BUMP_CHART]: BumpChart,
  [RESULT_VIEW_TYPES.SUNBURST]: Sunburst,
  [RESULT_VIEW_TYPES.EXPANDOTREE]: ExpandoTree,
  [RESULT_VIEW_TYPES.EPICURVE]: Histogram,
  [RESULT_VIEW_TYPES.NUMBER_TREND]: NumberTrend,
  [RESULT_VIEW_TYPES.PIE]: PieChart,
};
