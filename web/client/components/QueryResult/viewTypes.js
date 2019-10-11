// @flow

export type ResultViewType =
  | 'ANIMATED_MAP'
  | 'BOX'
  | 'CHART'
  | 'HEATMAP'
  | 'HEATTILES'
  | 'MAP'
  | 'TABLE'
  | 'BUBBLE_CHART'
  | 'BUMP_CHART'
  | 'BAR_GRAPH'
  | 'TIME'
  | 'SUNBURST'
  | 'EXPANDOTREE'
  | 'GEOMAP';

export const RESULT_VIEW_TYPES: { [ResultViewType]: ResultViewType } = {
  ANIMATED_MAP: 'ANIMATED_MAP',
  BOX: 'BOX',
  CHART: 'CHART',
  HEATMAP: 'HEATMAP',
  HEATTILES: 'HEATTILES',
  MAP: 'MAP',
  TABLE: 'TABLE',
  BUBBLE_CHART: 'BUBBLE_CHART',
  BUMP_CHART: 'BUMP_CHART',
  BAR_GRAPH: 'BAR_GRAPH',
  TIME: 'TIME',
  SUNBURST: 'SUNBURST',
  EXPANDOTREE: 'EXPANDOTREE',
  GEOMAP: 'GEOMAP',
};

// order for result views for main analyze page
export const RESULT_VIEW_ORDER: Array<ResultViewType> = [
  RESULT_VIEW_TYPES.CHART,
  RESULT_VIEW_TYPES.TIME,
  RESULT_VIEW_TYPES.TABLE,
  RESULT_VIEW_TYPES.MAP,
  RESULT_VIEW_TYPES.ANIMATED_MAP,
  RESULT_VIEW_TYPES.HEATMAP,
  RESULT_VIEW_TYPES.HEATTILES,
  RESULT_VIEW_TYPES.BUBBLE_CHART,
  RESULT_VIEW_TYPES.BUMP_CHART,
  RESULT_VIEW_TYPES.SUNBURST,
  RESULT_VIEW_TYPES.EXPANDOTREE,
  RESULT_VIEW_TYPES.BOX,
];

export const RESULT_VIEW_NAMES: { [ResultViewType]: string } = {
  [RESULT_VIEW_TYPES.ANIMATED_MAP]: t('visualizations.labels.animated_map'),
  [RESULT_VIEW_TYPES.BOX]: t('visualizations.labels.box_plot'),
  [RESULT_VIEW_TYPES.CHART]: t('visualizations.labels.chart'),
  [RESULT_VIEW_TYPES.HEATMAP]: t('visualizations.labels.heatmap'),
  [RESULT_VIEW_TYPES.HEATTILES]: t('visualizations.labels.heat_tiles'),
  [RESULT_VIEW_TYPES.MAP]: t('visualizations.labels.map'),
  [RESULT_VIEW_TYPES.TABLE]: t('visualizations.labels.table'),
  [RESULT_VIEW_TYPES.BUBBLE_CHART]: t('visualizations.labels.scatterplot'),
  [RESULT_VIEW_TYPES.BUMP_CHART]: t('visualizations.labels.bump_chart'),
  [RESULT_VIEW_TYPES.TIME]: t('visualizations.labels.time'),
  [RESULT_VIEW_TYPES.SUNBURST]: t('visualizations.labels.sunburst'),
  [RESULT_VIEW_TYPES.EXPANDOTREE]: t('visualizations.labels.expando'),
  [RESULT_VIEW_TYPES.GEOMAP]: t('visualizations.labels.geomap'),

  // NOTE(stephen): Use the `chart` translation string once the new bar graph
  // is the primary bar graph. This is only spelled differently to distinguish
  // the new bar graph from the original bar chart when both are available in
  // AQT at the same time. (This should be removed after the colombia demo
  // on 8/16/2019).
  [RESULT_VIEW_TYPES.BAR_GRAPH]: 'Bar Graph',
};
