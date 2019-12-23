// @flow
import BarGraphVisualization from 'components/ui/Icon/internal/SVGs/VisualizationIcons/BarGraphVisualization';
import BarLineGraphVisualization from 'components/ui/Icon/internal/SVGs/VisualizationIcons/BarLineGraphVisualization';
import HeatTilesVisualization from 'components/ui/Icon/internal/SVGs/VisualizationIcons/HeatTilesVisualization';
import HierarchyVisualization from 'components/ui/Icon/internal/SVGs/VisualizationIcons/HierarchyVisualization';
import HistogramVisualization from 'components/ui/Icon/internal/SVGs/VisualizationIcons/HistogramVisualization';
import LineGraphVisualization from 'components/ui/Icon/internal/SVGs/VisualizationIcons/LineGraphVisualization';
import MapVisualization from 'components/ui/Icon/internal/SVGs/VisualizationIcons/MapVisualization';
import RankingVisualization from 'components/ui/Icon/internal/SVGs/VisualizationIcons/RankingVisualization';
import ScatterplotVisualization from 'components/ui/Icon/internal/SVGs/VisualizationIcons/ScatterplotVisualization';
import ScorecardVisualization from 'components/ui/Icon/internal/SVGs/VisualizationIcons/ScorecardVisualization';
import StackedBarGraphVisualization from 'components/ui/Icon/internal/SVGs/VisualizationIcons/StackedBarGraphVisualization';
import SunburstVisualization from 'components/ui/Icon/internal/SVGs/VisualizationIcons/SunburstVisualization';
import TableVisualization from 'components/ui/Icon/internal/SVGs/VisualizationIcons/TableVisualization';

export type VisualizationsSVGMap = {|
  'svg-bar-graph-visualization': typeof BarGraphVisualization,
  'svg-bar-line-visualization': typeof BarLineGraphVisualization,
  'svg-heat-tiles-visualization': typeof HeatTilesVisualization,
  'svg-hierarchy-visualization': typeof HierarchyVisualization,
  'svg-histogram-visualization': typeof HistogramVisualization,
  'svg-line-graph-visualization': typeof LineGraphVisualization,
  'svg-map-visualization': typeof MapVisualization,
  'svg-ranking-visualization': typeof RankingVisualization,
  'svg-scatterplot-visualization': typeof ScatterplotVisualization,
  'svg-scorecard-visualization': typeof ScorecardVisualization,
  'svg-stacked-bar-graph-visualization': typeof StackedBarGraphVisualization,
  'svg-sunburst-visualization': typeof SunburstVisualization,
  'svg-table-visualization': typeof TableVisualization,
|};

export const VISUALIZATIONS_SVG_MAP: VisualizationsSVGMap = {
  'svg-bar-graph-visualization': BarGraphVisualization,
  'svg-bar-line-visualization': BarLineGraphVisualization,
  'svg-heat-tiles-visualization': HeatTilesVisualization,
  'svg-hierarchy-visualization': HierarchyVisualization,
  'svg-histogram-visualization': HistogramVisualization,
  'svg-line-graph-visualization': LineGraphVisualization,
  'svg-map-visualization': MapVisualization,
  'svg-ranking-visualization': RankingVisualization,
  'svg-scatterplot-visualization': ScatterplotVisualization,
  'svg-scorecard-visualization': ScorecardVisualization,
  'svg-stacked-bar-graph-visualization': StackedBarGraphVisualization,
  'svg-sunburst-visualization': SunburstVisualization,
  'svg-table-visualization': TableVisualization,
};
