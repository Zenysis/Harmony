// @flow

export type ResultViewTypeMap = {
  BAR_GRAPH: 'BAR_GRAPH',
  BOX_PLOT: 'BOX_PLOT',
  BUBBLE_CHART: 'BUBBLE_CHART',
  BUMP_CHART: 'BUMP_CHART',
  EPICURVE: 'EPICURVE',
  EXPANDOTREE: 'EXPANDOTREE',
  HEATTILES: 'HEATTILES',
  MAP: 'MAP',
  NUMBER_TREND: 'NUMBER_TREND',
  PIE: 'PIE',
  SUNBURST: 'SUNBURST',
  TABLE: 'TABLE',
  TIME: 'TIME',
};

export type ResultViewType = $Keys<ResultViewTypeMap>;

export const RESULT_VIEW_TYPES: ResultViewTypeMap = {
  BOX_PLOT: 'BOX_PLOT',
  EPICURVE: 'EPICURVE',
  HEATTILES: 'HEATTILES',
  MAP: 'MAP',
  TABLE: 'TABLE',
  BUBBLE_CHART: 'BUBBLE_CHART',
  BUMP_CHART: 'BUMP_CHART',
  BAR_GRAPH: 'BAR_GRAPH',
  TIME: 'TIME',
  SUNBURST: 'SUNBURST',
  EXPANDOTREE: 'EXPANDOTREE',
  NUMBER_TREND: 'NUMBER_TREND',
  PIE: 'PIE',
};

export const RESULT_VIEW_NAMES: $ObjMap<ResultViewTypeMap, () => string> = {
  [RESULT_VIEW_TYPES.BAR_GRAPH]: t('visualizations.labels.chart'),
  [RESULT_VIEW_TYPES.BOX_PLOT]: t('visualizations.labels.boxplot'),
  [RESULT_VIEW_TYPES.HEATTILES]: t('visualizations.labels.heatTiles'),
  [RESULT_VIEW_TYPES.MAP]: t('visualizations.labels.map'),
  [RESULT_VIEW_TYPES.TABLE]: t('visualizations.labels.table'),
  [RESULT_VIEW_TYPES.BUBBLE_CHART]: t('visualizations.labels.scatterplot'),
  [RESULT_VIEW_TYPES.BUMP_CHART]: t('visualizations.labels.bumpChart'),
  [RESULT_VIEW_TYPES.TIME]: t('visualizations.labels.time'),
  [RESULT_VIEW_TYPES.SUNBURST]: t('visualizations.labels.sunburst'),
  [RESULT_VIEW_TYPES.EXPANDOTREE]: t('visualizations.labels.expando'),
  [RESULT_VIEW_TYPES.EPICURVE]: t('visualizations.labels.epicurve'),
  [RESULT_VIEW_TYPES.NUMBER_TREND]: t('visualizations.labels.numberTrend'),
  PIE: 'Pie Chart',
};
