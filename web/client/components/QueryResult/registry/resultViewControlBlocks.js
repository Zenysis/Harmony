import AnimatedMapControlsBlock from 'components/visualizations/AnimatedMap/AnimatedMapControlsBlock';
import BarGraphControlsBlock from 'components/visualizations/BarGraph/BarGraphControlsBlock';
import BarGraphTNGControlsBlock from 'components/visualizations/BarGraphTNG/BarGraphControlsBlock';
import BoxPlotControlsBlock from 'components/visualizations/BoxPlot/BoxPlotControlsBlock';
import BubbleChartControlsBlock from 'components/visualizations/BubbleChart/BubbleChartControlsBlock';
import BumpChartControlsBlock from 'components/visualizations/BumpChart/BumpChartControlsBlock';
import ExpandoTreeControlsBlock from 'components/visualizations/ExpandoTree/ExpandoTreeControlsBlock';
import GeoMapControlsBlock from 'components/visualizations/GeoMap/GeoMapControlsBlock';
import HeatMapControlsBlock from 'components/visualizations/HeatMap/HeatMapControlsBlock';
import HeatTilesControlsBlock from 'components/visualizations/HeatTiles/HeatTilesControlsBlock';
import LineGraphControlsBlock from 'components/visualizations/LineGraph/LineGraphControlsBlock';
import MapControlsBlock from 'components/visualizations/Map/MapControlsBlock';
import SunburstControlsBlock from 'components/visualizations/Sunburst/SunburstControlsBlock';
import TableControlsBlock from 'components/visualizations/Table/TableControlsBlock';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/viewTypes';

export const RESULT_VIEW_CONTROLS_BLOCKS = {
  [RESULT_VIEW_TYPES.CHART]: BarGraphControlsBlock,
  [RESULT_VIEW_TYPES.BAR_GRAPH]: BarGraphTNGControlsBlock,
  [RESULT_VIEW_TYPES.TIME]: LineGraphControlsBlock,
  [RESULT_VIEW_TYPES.BOX]: BoxPlotControlsBlock,
  [RESULT_VIEW_TYPES.MAP]: MapControlsBlock,
  [RESULT_VIEW_TYPES.ANIMATED_MAP]: AnimatedMapControlsBlock,
  [RESULT_VIEW_TYPES.HEATMAP]: HeatMapControlsBlock,
  [RESULT_VIEW_TYPES.HEATTILES]: HeatTilesControlsBlock,
  [RESULT_VIEW_TYPES.BUBBLE_CHART]: BubbleChartControlsBlock,
  [RESULT_VIEW_TYPES.BUMP_CHART]: BumpChartControlsBlock,
  [RESULT_VIEW_TYPES.SUNBURST]: SunburstControlsBlock,
  [RESULT_VIEW_TYPES.EXPANDOTREE]: ExpandoTreeControlsBlock,
  [RESULT_VIEW_TYPES.GEOMAP]: GeoMapControlsBlock,
  [RESULT_VIEW_TYPES.TABLE]: TableControlsBlock,
};
