import AnimatedMap from 'components/visualizations/AnimatedMap';
import BarGraph from 'components/visualizations/BarGraph';
import BarGraphQueryResultData from 'components/visualizations/BarGraph/models/BarGraphQueryResultData';
import BarGraphTNG from 'components/visualizations/BarGraphTNG';
import BarGraphTNGQueryResultData from 'components/visualizations/BarGraphTNG/models/BarGraphQueryResultData';
import BoxPlot from 'components/visualizations/BoxPlot';
import BoxPlotQueryResultData from 'components/visualizations/BoxPlot/models/BoxPlotQueryResultData';
import BubbleChart from 'components/visualizations/BubbleChart';
import BumpChart from 'components/visualizations/BumpChart';
import BumpChartQueryResultData from 'components/visualizations/BumpChart/models/BumpChartQueryResultData';
import ExpandoTree from 'components/visualizations/ExpandoTree';
import GeoMap from 'components/visualizations/GeoMap';
import HeatMap from 'components/visualizations/HeatMap';
import HeatTiles from 'components/visualizations/HeatTiles';
import HeatTilesQueryResultData from 'models/visualizations/HeatTiles/HeatTilesQueryResultData';
import LegacyQueryResultData from 'components/visualizations/common/legacy/models/LegacyQueryResultData';
import LineGraph from 'components/visualizations/LineGraph';
import LineGraphQueryResultData from 'components/visualizations/LineGraph/models/LineGraphQueryResultData';
import Map from 'components/visualizations/Map';
import MapQueryResultData from 'components/visualizations/Map/models/MapQueryResultData';
import Sunburst from 'components/visualizations/Sunburst';
import Table from 'components/visualizations/Table';
import TableQueryResultData from 'components/visualizations/Table/models/TableQueryResultData';
import { RESULT_VIEW_CONTROLS_BLOCKS } from 'components/QueryResult/registry/resultViewControlBlocks';
import {
  RESULT_VIEW_NAMES,
  RESULT_VIEW_TYPES,
  RESULT_VIEW_ORDER,
} from 'components/QueryResult/viewTypes';

// TODO(pablo): remove these two exports. We should be using the exports from
// QueryResult/viewTypes instead in order to minimize circular dependencies
// in imports. But right now a lot of files are importing from
// QueryResult/common so it'll be tedious to change all those imports
export {
  RESULT_VIEW_TYPES,
  RESULT_VIEW_NAMES,
  RESULT_VIEW_ORDER,
  RESULT_VIEW_CONTROLS_BLOCKS,
};

export const RESULT_VIEW_COMPONENTS = {
  [RESULT_VIEW_TYPES.CHART]: BarGraph,
  [RESULT_VIEW_TYPES.BAR_GRAPH]: BarGraphTNG,
  [RESULT_VIEW_TYPES.TIME]: LineGraph,
  [RESULT_VIEW_TYPES.BOX]: BoxPlot,
  [RESULT_VIEW_TYPES.TABLE]: Table,
  [RESULT_VIEW_TYPES.MAP]: Map,
  [RESULT_VIEW_TYPES.ANIMATED_MAP]: AnimatedMap,
  [RESULT_VIEW_TYPES.HEATMAP]: HeatMap,
  [RESULT_VIEW_TYPES.HEATTILES]: HeatTiles,
  [RESULT_VIEW_TYPES.BUBBLE_CHART]: BubbleChart,
  [RESULT_VIEW_TYPES.BUMP_CHART]: BumpChart,
  [RESULT_VIEW_TYPES.SUNBURST]: Sunburst,
  [RESULT_VIEW_TYPES.EXPANDOTREE]: ExpandoTree,
  [RESULT_VIEW_TYPES.GEOMAP]: GeoMap,
};

export const MAP_VIEW_TYPES = new Set([
  RESULT_VIEW_TYPES.MAP,
  RESULT_VIEW_TYPES.HEATMAP,
  RESULT_VIEW_TYPES.ANIMATED_MAP,
]);

export const RESULT_VIEW_DATA_MODEL = {
  [RESULT_VIEW_TYPES.CHART]: BarGraphQueryResultData,
  [RESULT_VIEW_TYPES.BAR_GRAPH]: BarGraphTNGQueryResultData,
  [RESULT_VIEW_TYPES.TIME]: LineGraphQueryResultData,
  [RESULT_VIEW_TYPES.BOX]: BoxPlotQueryResultData,
  [RESULT_VIEW_TYPES.TABLE]: TableQueryResultData,
  [RESULT_VIEW_TYPES.MAP]: MapQueryResultData,
  [RESULT_VIEW_TYPES.ANIMATED_MAP]: LegacyQueryResultData,
  [RESULT_VIEW_TYPES.HEATMAP]: LegacyQueryResultData,
  [RESULT_VIEW_TYPES.HEATTILES]: HeatTilesQueryResultData,
  [RESULT_VIEW_TYPES.BUBBLE_CHART]: LegacyQueryResultData,
  [RESULT_VIEW_TYPES.BUMP_CHART]: BumpChartQueryResultData,
  [RESULT_VIEW_TYPES.SUNBURST]: LegacyQueryResultData,
  [RESULT_VIEW_TYPES.EXPANDOTREE]: LegacyQueryResultData,
  [RESULT_VIEW_TYPES.GEOMAP]: LegacyQueryResultData,
};
