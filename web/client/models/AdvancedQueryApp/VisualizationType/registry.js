// @flow
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
  BAR_LINE: 'BAR_LINE',
  BAR_OVERLAPPING: 'BAR_OVERLAPPING',
  BAR_STACKED: 'BAR_STACKED',
  BAR_HORIZONTAL: 'BAR_HORIZONTAL',
  BAR_HORIZONTAL_LINE: 'BAR_HORIZONTAL_LINE',
  BAR_HORIZONTAL_OVERLAPPING: 'BAR_HORIZONTAL_OVERLAPPING',
  BAR_HORIZONTAL_STACKED: 'BAR_HORIZONTAL_STACKED',
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

const VIZ_TEXT = t('visualizations.labels');

export const VISUALIZATION_INFO: $ObjMap<
  VisualizationTypeMap,
  () => VisualizationInfo,
> = {
  BAR: { name: VIZ_TEXT.chart, icon: 'svg-bar-graph-visualization' },
  BAR_LINE: { name: VIZ_TEXT.barLine, icon: 'svg-bar-line-visualization' },
  BAR_OVERLAPPING: {
    name: VIZ_TEXT.overlappingBar,
    icon: 'svg-overlapping-bar-graph-visualization',
  },
  BAR_STACKED: {
    name: VIZ_TEXT.stackedBar,
    icon: 'svg-stacked-bar-graph-visualization',
  },

  // TODO(stephen): Translate the horizontal bar chart names.
  BAR_HORIZONTAL: {
    name: `${VIZ_TEXT.chart} (Horizontal)`,
    icon: 'svg-bar-graph-visualization',
    iconStyle: { transform: 'rotate(90deg)' },
  },
  BAR_HORIZONTAL_LINE: {
    name: `${VIZ_TEXT.barLine} (Horizontal)`,
    icon: 'svg-bar-line-visualization',
    iconStyle: { transform: 'rotate(90deg)' },
  },
  BAR_HORIZONTAL_OVERLAPPING: {
    name: `${VIZ_TEXT.overlappingBar} (Horizontal)`,
    icon: 'svg-overlapping-bar-graph-visualization',
    iconStyle: { transform: 'rotate(90deg)' },
  },
  BAR_HORIZONTAL_STACKED: {
    name: `${VIZ_TEXT.stackedBar} (Horizontal)`,
    icon: 'svg-stacked-bar-graph-visualization',
    iconStyle: { transform: 'rotate(90deg)' },
  },
  BOXPLOT: { name: VIZ_TEXT.boxplot, icon: 'svg-box-plot-visualization' },
  EPICURVE: { name: VIZ_TEXT.epicurve, icon: 'svg-histogram-visualization' },
  HEATTILES: { name: VIZ_TEXT.heatTiles, icon: 'svg-heat-tiles-visualization' },
  HIERARCHY: { name: VIZ_TEXT.expando, icon: 'svg-hierarchy-visualization' },
  LINE: { name: VIZ_TEXT.time, icon: 'svg-line-graph-visualization' },

  // TODO(pablo, stephen): Get different icons for map, animated map, heat map,
  // and animated heat map.
  MAP: { name: VIZ_TEXT.map, icon: 'svg-map-visualization' },
  MAP_ANIMATED: { name: VIZ_TEXT.animatedMap, icon: 'svg-map-visualization' },
  MAP_HEATMAP: { name: VIZ_TEXT.heatmap, icon: 'svg-map-visualization' },
  MAP_HEATMAP_ANIMATED: {
    name: VIZ_TEXT.animatedHeatMap,
    icon: 'svg-map-visualization',
  },
  NUMBER_TREND: {
    name: VIZ_TEXT.number,
    icon: 'svg-number-visualization',
  },
  NUMBER_TREND_SPARK_LINE: {
    name: VIZ_TEXT.numberTrend,
    icon: 'svg-number-trend-visualization',
  },
  PIE: { name: VIZ_TEXT.pieChart, icon: 'svg-pie-chart-visualization' },
  RANKING: { name: VIZ_TEXT.bumpChart, icon: 'svg-ranking-visualization' },
  SCATTERPLOT: {
    name: VIZ_TEXT.scatterplot,
    icon: 'svg-scatterplot-visualization',
  },
  SUNBURST: { name: VIZ_TEXT.sunburst, icon: 'svg-sunburst-visualization' },
  TABLE: { name: VIZ_TEXT.table, icon: 'svg-table-visualization' },
  TABLE_SCORECARD: {
    name: VIZ_TEXT.scorecard,
    icon: 'svg-scorecard-visualization',
  },
};

const GROUP_NAMES = t(
  'AdvancedQueryApp.LiveResultsView.VisualizationPicker.visualizationGroupings',
);
export const VISUALIZATION_GROUPINGS: $ObjMap<
  VisualizationGroupMap,
  () => VisualizationGroupInfo,
> = {
  GEOGRAPHIC: {
    name: GROUP_NAMES.geography,
    visualizations: [
      VISUALIZATION_TYPE.MAP,
      VISUALIZATION_TYPE.MAP_HEATMAP,
      VISUALIZATION_TYPE.MAP_ANIMATED,
      VISUALIZATION_TYPE.MAP_HEATMAP_ANIMATED,
    ],
  },
  OTHER: {
    name: GROUP_NAMES.outliersCorrelationsAndMore,
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
    name: GROUP_NAMES.tableAndBarCharts,
    visualizations: [
      VISUALIZATION_TYPE.TABLE,
      VISUALIZATION_TYPE.TABLE_SCORECARD,
      VISUALIZATION_TYPE.BAR,
      VISUALIZATION_TYPE.BAR_STACKED,
      VISUALIZATION_TYPE.BAR_OVERLAPPING,

      // NOTE(stephen): Omitting bar + line graph for now since the settings it
      // applies are less straightforward to users. (Series are moved from y1
      // to y2).
      // VISUALIZATION_TYPE.BAR_LINE,

      // NOTE(stephen): Omitting the horizontal bar variants for now to not
      // overwhelm the user.
      // VISUALIZATION_TYPE.BAR_HORIZONTAL,
      // VISUALIZATION_TYPE.BAR_HORIZONTAL_STACKED,
      // VISUALIZATION_TYPE.BAR_HORIZONTAL_OVERLAPPING,
    ],
  },
  TIME: {
    name: GROUP_NAMES.time,
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

// TODO(stephen, pablo): fill these out, currently just hardcoded anything just
// so we can test. Do not assume these are the real requirements.
export const VISUALIZATION_REQUIREMENTS: VisualizationRequirementsMap = {
  BAR: {
    field: { min: 1, max: undefined },
    grouping: undefined,
  },
  BAR_LINE: {
    field: { min: 2, max: undefined },
    grouping: undefined,
  },
  BAR_OVERLAPPING: {
    field: { min: 2, max: undefined },
    grouping: undefined,
  },
  BAR_STACKED: {
    field: { min: 2, max: undefined },
    grouping: undefined,
  },
  BAR_HORIZONTAL: {
    field: { min: 1, max: undefined },
    grouping: undefined,
  },
  BAR_HORIZONTAL_LINE: {
    field: { min: 2, max: undefined },
    grouping: undefined,
  },
  BAR_HORIZONTAL_OVERLAPPING: {
    field: { min: 2, max: undefined },
    grouping: undefined,
  },
  BAR_HORIZONTAL_STACKED: {
    field: { min: 2, max: undefined },
    grouping: undefined,
  },
  BOXPLOT: {
    field: { min: 1, max: undefined },
    grouping: [{ type: 'DIMENSION', min: 1, max: undefined }],
  },
  EPICURVE: {
    field: { min: 1, max: undefined },
    grouping: [
      { type: 'TIME', min: 1, max: 1 },
      { type: 'DIMENSION', min: 0, max: 1 },
    ],
  },
  HEATTILES: {
    field: { min: 1, max: undefined },
    grouping: [{ type: 'TIME', min: 1, max: 1 }],
  },
  HIERARCHY: {
    field: { min: 1, max: undefined },
    grouping: [{ type: 'DIMENSION', min: 1, max: undefined }],
  },
  LINE: {
    field: { min: 1, max: undefined },
    grouping: [{ type: 'TIME', min: 1, max: 1 }],
  },
  MAP: {
    field: { min: 1, max: undefined },
    grouping: [
      { type: 'GEOGRAPHY', min: 1, max: 1 },
      { type: 'TIME', min: 0, max: 0 },
    ],
  },
  MAP_ANIMATED: {
    field: { min: 1, max: undefined },
    grouping: [
      { type: 'GEOGRAPHY', min: 1, max: 1 },
      { type: 'TIME', min: 1, max: 1 },
    ],
  },
  MAP_HEATMAP: {
    field: { min: 1, max: undefined },
    grouping: [
      { type: 'GEOGRAPHY', min: 1, max: 1 },
      { type: 'TIME', min: 0, max: 0 },
    ],
  },
  MAP_HEATMAP_ANIMATED: {
    field: { min: 1, max: undefined },
    grouping: [
      { type: 'GEOGRAPHY', min: 1, max: 1 },
      { type: 'TIME', min: 1, max: 1 },
    ],
  },
  NUMBER_TREND: {
    field: { min: 1, max: undefined },
    // No grouping
    grouping: [{ type: 'DIMENSION', min: 0, max: 0 }],
  },
  NUMBER_TREND_SPARK_LINE: {
    field: { min: 1, max: undefined },
    grouping: [
      { type: 'TIME', min: 1, max: 1 },
      { type: 'DIMENSION', min: 0, max: 0 },
    ],
  },
  PIE: {
    field: { min: 1, max: undefined },
    grouping: undefined,
  },
  RANKING: {
    field: { min: 1, max: undefined },
    grouping: [
      { type: 'DIMENSION', min: 1, max: undefined },
      { type: 'TIME', min: 1, max: 1 },
    ],
  },
  SCATTERPLOT: {
    field: { min: 2, max: undefined },
    grouping: [{ type: 'DIMENSION', min: 1, max: undefined }],
  },
  SUNBURST: {
    field: { min: 1, max: undefined },
    grouping: [{ type: 'DIMENSION', min: 1, max: undefined }],
  },
  TABLE: {
    field: { min: 1, max: undefined },
    grouping: undefined,
  },
  TABLE_SCORECARD: {
    field: { min: 1, max: undefined },
    grouping: undefined,
  },
};

// NOTE(stephen.byarugaba): the first vizualization's requirements for a given
// viz type are used as loose requirements for subsequent types eg BAR_LINE, BAR_OVERLAPPING...
// all use BAR's requirements as their loose reuirements
export const LOOSE_VISUALIZATION_REQUIREMENTS: VisualizationRequirementsMap = {
  ...VISUALIZATION_REQUIREMENTS,
  BAR_LINE: {
    field: { min: 1, max: undefined },
    grouping: undefined,
  },
  BAR_OVERLAPPING: {
    field: { min: 1, max: undefined },
    grouping: undefined,
  },
  BAR_STACKED: {
    field: { min: 1, max: undefined },
    grouping: undefined,
  },
  BAR_HORIZONTAL_LINE: {
    field: { min: 1, max: undefined },
    grouping: undefined,
  },
  BAR_HORIZONTAL_OVERLAPPING: {
    field: { min: 1, max: undefined },
    grouping: undefined,
  },
  BAR_HORIZONTAL_STACKED: {
    field: { min: 1, max: undefined },
    grouping: undefined,
  },
  MAP_ANIMATED: {
    field: { min: 1, max: undefined },
    grouping: [
      { type: 'GEOGRAPHY', min: 1, max: 1 },
      { type: 'TIME', min: 0, max: 1 },
    ],
  },
  MAP_HEATMAP: {
    field: { min: 1, max: undefined },
    grouping: [
      { type: 'GEOGRAPHY', min: 1, max: 1 },
      { type: 'TIME', min: 0, max: 1 },
    ],
  },
  MAP_HEATMAP_ANIMATED: {
    field: { min: 1, max: undefined },
    grouping: [
      { type: 'GEOGRAPHY', min: 1, max: 1 },
      { type: 'TIME', min: 0, max: 1 },
    ],
  },
  // NUMBER_TREND loose requirements
  NUMBER_TREND_SPARK_LINE: {
    field: { min: 1, max: undefined },
    // No grouping
    grouping: [{ type: 'DIMENSION', min: 0, max: 0 }],
  },
};

// map a ResultViewType to the best matching visualization type for it
export const VIEW_TYPE_TO_VISUALIZATION_TYPE = Object.freeze({
  BOX: VISUALIZATION_TYPE.BOXPLOT, // deprecated SQT box plot
  BOX_PLOT: VISUALIZATION_TYPE.BOXPLOT,
  EPICURVE: VISUALIZATION_TYPE.EPICURVE,
  HEATTILES: VISUALIZATION_TYPE.HEATTILES,
  MAP: VISUALIZATION_TYPE.MAP,
  TABLE: VISUALIZATION_TYPE.TABLE,
  BUBBLE_CHART: VISUALIZATION_TYPE.SCATTERPLOT,
  BUMP_CHART: VISUALIZATION_TYPE.RANKING,
  BAR_GRAPH: VISUALIZATION_TYPE.BAR,
  TIME: VISUALIZATION_TYPE.LINE,
  SUNBURST: VISUALIZATION_TYPE.SUNBURST,
  EXPANDOTREE: VISUALIZATION_TYPE.HIERARCHY,
  PIE: VISUALIZATION_TYPE.PIE,
  NUMBER_TREND: VISUALIZATION_TYPE.NUMBER_TREND,
});

export const VISUALIZATION_TO_VIEW_TYPE: $ObjMap<
  VisualizationTypeMap,
  () => ResultViewType,
> = {
  BAR: RESULT_VIEW_TYPES.BAR_GRAPH,
  BAR_LINE: RESULT_VIEW_TYPES.BAR_GRAPH,
  BAR_OVERLAPPING: RESULT_VIEW_TYPES.BAR_GRAPH,
  BAR_STACKED: RESULT_VIEW_TYPES.BAR_GRAPH,
  BAR_HORIZONTAL: RESULT_VIEW_TYPES.BAR_GRAPH,
  BAR_HORIZONTAL_LINE: RESULT_VIEW_TYPES.BAR_GRAPH,
  BAR_HORIZONTAL_OVERLAPPING: RESULT_VIEW_TYPES.BAR_GRAPH,
  BAR_HORIZONTAL_STACKED: RESULT_VIEW_TYPES.BAR_GRAPH,
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
