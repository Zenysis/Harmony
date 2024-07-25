// @flow

type OutlierTypeMap = {
  ALL: 'All',
  EXTREME: 'Extreme',
  MODERATE: 'Moderate',
};

export const OUTLIER_TYPE: OutlierTypeMap = {
  ALL: 'All',
  EXTREME: 'Extreme',
  MODERATE: 'Moderate',
};

export type OutlierType = $Values<OutlierTypeMap>;

export const OVERVIEW_VIZ_NAMES = {
  BOX_PLOT: 'boxPlot',
  TABLE: 'table',
};

export type OverviewViz = $Values<typeof OVERVIEW_VIZ_NAMES>;
