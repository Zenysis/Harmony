// @flow
import I18N from 'lib/I18N';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/viewTypes';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type {
  VisualizationGroup,
  VisualizationGroupInfo,
  VisualizationGroupMap,
  VisualizationInfo,
  VisualizationRequirementsMap,
  VisualizationType,
  VisualizationTypeMap,
} from 'models/AdvancedQueryApp/VisualizationType/types';

export const VISUALIZATION_TYPE: VisualizationTypeMap = {
  BAR: 'BAR',
  BAR_HORIZONTAL: 'BAR_HORIZONTAL',
  BAR_HORIZONTAL_LINE: 'BAR_HORIZONTAL_LINE',
  BAR_HORIZONTAL_OVERLAPPING: 'BAR_HORIZONTAL_OVERLAPPING',
  BAR_HORIZONTAL_STACKED: 'BAR_HORIZONTAL_STACKED',
  BAR_LINE: 'BAR_LINE',
  BAR_OVERLAPPING: 'BAR_OVERLAPPING',
  BAR_STACKED: 'BAR_STACKED',
  BOXPLOT: 'BOXPLOT',
  EPICURVE: 'EPICURVE',
  HEATTILES: 'HEATTILES',
  HIERARCHY: 'HIERARCHY',
  LINE: 'LINE',
  MAP: 'MAP',
  MAP_ANIMATED: 'MAP_ANIMATED',
  MAP_HEATMAP: 'MAP_HEATMAP',
  MAP_HEATMAP_ANIMATED: 'MAP_HEATMAP_ANIMATED',
  NUMBER_TREND: 'NUMBER_TREND',
  NUMBER_TREND_SPARK_LINE: 'NUMBER_TREND_SPARK_LINE',
  PIE: 'PIE',
  RANKING: 'RANKING',
  SCATTERPLOT: 'SCATTERPLOT',
  SUNBURST: 'SUNBURST',
  TABLE: 'TABLE',
  TABLE_SCORECARD: 'TABLE_SCORECARD',
};

export const VISUALIZATION_TYPES: $ReadOnlyArray<VisualizationType> = Object.keys(
  VISUALIZATION_TYPE,
);

export const DEFAULT_VISUALIZATION_TYPE: VisualizationType =
  VISUALIZATION_TYPE.TABLE;

export const CONTROL_BAR_VISUALIZATION_ORDER = [
  VISUALIZATION_TYPE.TABLE,
  VISUALIZATION_TYPE.BAR,
  VISUALIZATION_TYPE.LINE,
  VISUALIZATION_TYPE.MAP,
  VISUALIZATION_TYPE.SCATTERPLOT,
  VISUALIZATION_TYPE.RANKING,
];

export const VISUALIZATION_INFO: $ObjMap<
  VisualizationTypeMap,
  () => VisualizationInfo,
> = {
  BAR: {
    icon: 'svg-bar-graph-visualization',
    name: I18N.textById('Bar chart'),
  },

  BAR_HORIZONTAL: {
    icon: 'svg-bar-graph-visualization',
    iconStyle: { transform: 'rotate(90deg)' },
    name: I18N.text('Bar chart (Horizontal)'),
  },
  BAR_HORIZONTAL_LINE: {
    icon: 'svg-bar-line-visualization',
    iconStyle: { transform: 'rotate(90deg)' },
    name: I18N.text('Bar & Line (Horizontal)'),
  },
  BAR_HORIZONTAL_OVERLAPPING: {
    icon: 'svg-overlapping-bar-graph-visualization',
    iconStyle: { transform: 'rotate(90deg)' },
    name: I18N.text('Overlapping bar (Horizontal)'),
  },
  BAR_HORIZONTAL_STACKED: {
    icon: 'svg-stacked-bar-graph-visualization',
    iconStyle: { transform: 'rotate(90deg)' },
    name: I18N.text('Stacked bar (Horizontal)'),
  },

  BAR_LINE: {
    icon: 'svg-bar-line-visualization',
    name: I18N.text('Bar & Line'),
  },
  BAR_OVERLAPPING: {
    icon: 'svg-overlapping-bar-graph-visualization',
    name: I18N.text('Overlapping bar'),
  },
  BAR_STACKED: {
    icon: 'svg-stacked-bar-graph-visualization',
    name: I18N.text('Stacked bar'),
  },

  BOXPLOT: { icon: 'svg-box-plot-visualization', name: I18N.text('Box plot') },
  EPICURVE: {
    icon: 'svg-histogram-visualization',
    name: I18N.text('Epicurve'),
  },
  HEATTILES: {
    icon: 'svg-heat-tiles-visualization',
    name: I18N.text('Heat tiles'),
  },
  HIERARCHY: {
    icon: 'svg-hierarchy-visualization',
    name: I18N.text('Hierarchy'),
  },
  LINE: {
    icon: 'svg-line-graph-visualization',
    name: I18N.text('Time series'),
  },

  // TODO: Get different icons for map, animated map, heat map,
  // and animated heat map.
  MAP: { icon: 'svg-map-visualization', name: I18N.text('Map') },
  MAP_ANIMATED: {
    icon: 'svg-map-visualization',
    name: I18N.text('Animated map'),
  },
  MAP_HEATMAP: { icon: 'svg-map-visualization', name: I18N.text('Heatmap') },
  MAP_HEATMAP_ANIMATED: {
    icon: 'svg-map-visualization',
    name: I18N.text('Animated heat map'),
  },
  NUMBER_TREND: {
    icon: 'svg-number-visualization',
    name: I18N.textById('Number'),
  },
  NUMBER_TREND_SPARK_LINE: {
    icon: 'svg-number-trend-visualization',
    name: I18N.text('Number and trend'),
  },
  PIE: { icon: 'svg-pie-chart-visualization', name: I18N.text('Pie chart') },
  RANKING: { icon: 'svg-ranking-visualization', name: I18N.text('Ranking') },
  SCATTERPLOT: {
    icon: 'svg-scatterplot-visualization',
    name: I18N.text('Scatterplot'),
  },
  SUNBURST: { icon: 'svg-sunburst-visualization', name: I18N.text('Sunburst') },
  TABLE: { icon: 'svg-table-visualization', name: I18N.textById('Table') },
  TABLE_SCORECARD: {
    icon: 'svg-scorecard-visualization',
    name: I18N.text('Scorecard'),
  },
};

export const VISUALIZATION_GROUPINGS: $ObjMap<
  VisualizationGroupMap,
  () => VisualizationGroupInfo,
> = {
  GEOGRAPHIC: {
    name: I18N.textById('Geography'),
    visualizations: [
      VISUALIZATION_TYPE.MAP,
      VISUALIZATION_TYPE.MAP_HEATMAP,
      VISUALIZATION_TYPE.MAP_ANIMATED,
      VISUALIZATION_TYPE.MAP_HEATMAP_ANIMATED,
    ],
  },
  OTHER: {
    name: I18N.text('Outliers, correlations, and more'),
    visualizations: [
      VISUALIZATION_TYPE.BOXPLOT,
      VISUALIZATION_TYPE.SCATTERPLOT,
      VISUALIZATION_TYPE.PIE,
      VISUALIZATION_TYPE.SUNBURST,
      VISUALIZATION_TYPE.HIERARCHY,
      VISUALIZATION_TYPE.NUMBER_TREND,
      VISUALIZATION_TYPE.NUMBER_TREND_SPARK_LINE,
    ],
  },
  TABLE_AND_BAR: {
    name: I18N.text('Table and bar charts'),
    visualizations: [
      VISUALIZATION_TYPE.TABLE,
      VISUALIZATION_TYPE.TABLE_SCORECARD,
      VISUALIZATION_TYPE.BAR,
      VISUALIZATION_TYPE.BAR_STACKED,
      VISUALIZATION_TYPE.BAR_OVERLAPPING,

      // NOTE: Omitting bar + line graph for now since the settings it
      // applies are less straightforward to users. (Series are moved from y1
      // to y2).
      // VISUALIZATION_TYPE.BAR_LINE,

      // NOTE: Omitting the horizontal bar variants for now to not
      // overwhelm the user.
      // VISUALIZATION_TYPE.BAR_HORIZONTAL,
      // VISUALIZATION_TYPE.BAR_HORIZONTAL_STACKED,
      // VISUALIZATION_TYPE.BAR_HORIZONTAL_OVERLAPPING,
    ],
  },
  TIME: {
    name: I18N.text('Time'),
    visualizations: [
      VISUALIZATION_TYPE.LINE,
      VISUALIZATION_TYPE.RANKING,
      VISUALIZATION_TYPE.HEATTILES,
      VISUALIZATION_TYPE.EPICURVE,
    ],
  },
};

export const VISUALIZATION_GROUP_ORDER: $ReadOnlyArray<VisualizationGroup> = [
  'TABLE_AND_BAR',
  'TIME',
  'GEOGRAPHIC',
  'OTHER',
];

// TODO: fill these out, currently just hardcoded anything just
// so we can test. Do not assume these are the real requirements.
export const VISUALIZATION_REQUIREMENTS: VisualizationRequirementsMap = {
  BAR: {
    field: { max: undefined, min: 1 },
    grouping: undefined,
  },
  BAR_HORIZONTAL: {
    field: { max: undefined, min: 1 },
    grouping: undefined,
  },
  BAR_HORIZONTAL_LINE: {
    field: { max: undefined, min: 2 },
    grouping: undefined,
  },
  BAR_HORIZONTAL_OVERLAPPING: {
    field: { max: undefined, min: 2 },
    grouping: undefined,
  },
  BAR_HORIZONTAL_STACKED: {
    field: { max: undefined, min: 2 },
    grouping: undefined,
  },
  BAR_LINE: {
    field: { max: undefined, min: 2 },
    grouping: undefined,
  },
  BAR_OVERLAPPING: {
    field: { max: undefined, min: 2 },
    grouping: undefined,
  },
  BAR_STACKED: {
    field: { max: undefined, min: 2 },
    grouping: undefined,
  },
  BOXPLOT: {
    field: { max: undefined, min: 1 },
    grouping: [{ max: undefined, min: 1, type: 'DIMENSION' }],
  },
  EPICURVE: {
    field: { max: undefined, min: 1 },
    grouping: [
      { max: 1, min: 1, type: 'TIME' },
      { max: 1, min: 0, type: 'DIMENSION' },
    ],
  },
  HEATTILES: {
    field: { max: undefined, min: 1 },
    grouping: [{ max: 1, min: 1, type: 'TIME' }],
  },
  HIERARCHY: {
    field: { max: undefined, min: 1 },
    grouping: [{ max: undefined, min: 1, type: 'DIMENSION' }],
  },
  LINE: {
    field: { max: undefined, min: 1 },
    grouping: [{ max: 1, min: 1, type: 'TIME' }],
  },
  MAP: {
    field: { max: undefined, min: 1 },
    grouping: [
      { max: 1, min: 1, type: 'GEOGRAPHY' },
      { max: 0, min: 0, type: 'TIME' },
    ],
  },
  MAP_ANIMATED: {
    field: { max: undefined, min: 1 },
    grouping: [
      { max: 1, min: 1, type: 'GEOGRAPHY' },
      { max: 1, min: 1, type: 'TIME' },
    ],
  },
  MAP_HEATMAP: {
    field: { max: undefined, min: 1 },
    grouping: [
      { max: 1, min: 1, type: 'GEOGRAPHY' },
      { max: 0, min: 0, type: 'TIME' },
    ],
  },
  MAP_HEATMAP_ANIMATED: {
    field: { max: undefined, min: 1 },
    grouping: [
      { max: 1, min: 1, type: 'GEOGRAPHY' },
      { max: 1, min: 1, type: 'TIME' },
    ],
  },
  NUMBER_TREND: {
    field: { max: undefined, min: 1 },
    // No grouping
    grouping: [{ max: 0, min: 0, type: 'DIMENSION' }],
  },
  NUMBER_TREND_SPARK_LINE: {
    field: { max: undefined, min: 1 },
    grouping: [
      { max: 1, min: 1, type: 'TIME' },
      { max: 0, min: 0, type: 'DIMENSION' },
    ],
  },
  PIE: {
    field: { max: undefined, min: 1 },
    grouping: undefined,
  },
  RANKING: {
    field: { max: undefined, min: 1 },
    grouping: [
      { max: undefined, min: 1, type: 'DIMENSION' },
      { max: 1, min: 1, type: 'TIME' },
    ],
  },
  SCATTERPLOT: {
    field: { max: undefined, min: 2 },
    grouping: [{ max: undefined, min: 1, type: 'DIMENSION' }],
  },
  SUNBURST: {
    field: { max: undefined, min: 1 },
    grouping: [{ max: undefined, min: 1, type: 'DIMENSION' }],
  },
  TABLE: {
    field: { max: undefined, min: 1 },
    grouping: undefined,
  },
  TABLE_SCORECARD: {
    field: { max: undefined, min: 1 },
    grouping: undefined,
  },
};

// NOTE: the first vizualization's requirements for a given
// viz type are used as loose requirements for subsequent types eg BAR_LINE, BAR_OVERLAPPING...
// all use BAR's requirements as their loose reuirements
export const LOOSE_VISUALIZATION_REQUIREMENTS: VisualizationRequirementsMap = {
  ...VISUALIZATION_REQUIREMENTS,
  BAR_HORIZONTAL_LINE: {
    field: { max: undefined, min: 1 },
    grouping: undefined,
  },
  BAR_HORIZONTAL_OVERLAPPING: {
    field: { max: undefined, min: 1 },
    grouping: undefined,
  },
  BAR_HORIZONTAL_STACKED: {
    field: { max: undefined, min: 1 },
    grouping: undefined,
  },
  BAR_LINE: {
    field: { max: undefined, min: 1 },
    grouping: undefined,
  },
  BAR_OVERLAPPING: {
    field: { max: undefined, min: 1 },
    grouping: undefined,
  },
  BAR_STACKED: {
    field: { max: undefined, min: 1 },
    grouping: undefined,
  },
  MAP_ANIMATED: {
    field: { max: undefined, min: 1 },
    grouping: [
      { max: 1, min: 1, type: 'GEOGRAPHY' },
      { max: 1, min: 0, type: 'TIME' },
    ],
  },
  MAP_HEATMAP: {
    field: { max: undefined, min: 1 },
    grouping: [
      { max: 1, min: 1, type: 'GEOGRAPHY' },
      { max: 1, min: 0, type: 'TIME' },
    ],
  },
  MAP_HEATMAP_ANIMATED: {
    field: { max: undefined, min: 1 },
    grouping: [
      { max: 1, min: 1, type: 'GEOGRAPHY' },
      { max: 1, min: 0, type: 'TIME' },
    ],
  },
  // NUMBER_TREND loose requirements
  NUMBER_TREND_SPARK_LINE: {
    field: { max: undefined, min: 1 },
    // No grouping
    grouping: [{ max: 0, min: 0, type: 'DIMENSION' }],
  },
};

// map a ResultViewType to the best matching visualization type for it
export const VIEW_TYPE_TO_VISUALIZATION_TYPE = Object.freeze({
  BAR_GRAPH: VISUALIZATION_TYPE.BAR,
  BOX: VISUALIZATION_TYPE.BOXPLOT, // deprecated SQT box plot
  BOX_PLOT: VISUALIZATION_TYPE.BOXPLOT,
  BUBBLE_CHART: VISUALIZATION_TYPE.SCATTERPLOT,
  BUMP_CHART: VISUALIZATION_TYPE.RANKING,
  EPICURVE: VISUALIZATION_TYPE.EPICURVE,
  EXPANDOTREE: VISUALIZATION_TYPE.HIERARCHY,
  HEATTILES: VISUALIZATION_TYPE.HEATTILES,
  MAP: VISUALIZATION_TYPE.MAP,
  NUMBER_TREND: VISUALIZATION_TYPE.NUMBER_TREND,
  PIE: VISUALIZATION_TYPE.PIE,
  SUNBURST: VISUALIZATION_TYPE.SUNBURST,
  TABLE: VISUALIZATION_TYPE.TABLE,
  TIME: VISUALIZATION_TYPE.LINE,
});

export const VISUALIZATION_TO_VIEW_TYPE: $ObjMap<
  VisualizationTypeMap,
  () => ResultViewType,
> = {
  BAR: RESULT_VIEW_TYPES.BAR_GRAPH,
  BAR_HORIZONTAL: RESULT_VIEW_TYPES.BAR_GRAPH,
  BAR_HORIZONTAL_LINE: RESULT_VIEW_TYPES.BAR_GRAPH,
  BAR_HORIZONTAL_OVERLAPPING: RESULT_VIEW_TYPES.BAR_GRAPH,
  BAR_HORIZONTAL_STACKED: RESULT_VIEW_TYPES.BAR_GRAPH,
  BAR_LINE: RESULT_VIEW_TYPES.BAR_GRAPH,
  BAR_OVERLAPPING: RESULT_VIEW_TYPES.BAR_GRAPH,
  BAR_STACKED: RESULT_VIEW_TYPES.BAR_GRAPH,
  BOXPLOT: RESULT_VIEW_TYPES.BOX_PLOT,
  EPICURVE: RESULT_VIEW_TYPES.EPICURVE,
  HEATTILES: RESULT_VIEW_TYPES.HEATTILES,
  HIERARCHY: RESULT_VIEW_TYPES.EXPANDOTREE,
  LINE: RESULT_VIEW_TYPES.TIME,
  MAP: RESULT_VIEW_TYPES.MAP,
  MAP_ANIMATED: RESULT_VIEW_TYPES.MAP,
  MAP_HEATMAP: RESULT_VIEW_TYPES.MAP,
  MAP_HEATMAP_ANIMATED: RESULT_VIEW_TYPES.MAP,
  NUMBER_TREND: RESULT_VIEW_TYPES.NUMBER_TREND,
  NUMBER_TREND_SPARK_LINE: RESULT_VIEW_TYPES.NUMBER_TREND,
  PIE: RESULT_VIEW_TYPES.PIE,
  RANKING: RESULT_VIEW_TYPES.BUMP_CHART,
  SCATTERPLOT: RESULT_VIEW_TYPES.BUBBLE_CHART,
  SUNBURST: RESULT_VIEW_TYPES.SUNBURST,
  TABLE: RESULT_VIEW_TYPES.TABLE,
  TABLE_SCORECARD: RESULT_VIEW_TYPES.TABLE,
};
