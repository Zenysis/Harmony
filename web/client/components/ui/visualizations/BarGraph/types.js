// @flow
export type DimensionID = string;
export type MetricID = string;

export type DataPoint = {
  dimensions: {
    +[DimensionID]: string | null,
  },
  metrics: {
    +[MetricID]: number | null,
  },
};

export type BarGroupSpec = {
  field: string,
  sortAscending: boolean,
  type: 'dimension' | 'metric',
};

// TODO(stephen): FIX THIS.
type BandScale = any;
type LinearScale = any;

export type ScaleMap = {
  /**
   * Positioning of the individual bars within a group.
   */
  +barScale: BandScale,

  /**
   * Positioning of the bar groups along the x-axis.
   */
  +barGroupScale: BandScale,

  /**
   * Scale for the Y1 (primary) y-axis.
   */
  +y1Scale: LinearScale | void,

  /**
   * Scale for the Y2 (secondary) y-axis.
   */
  +y2Scale: LinearScale | void,
};

export type YAxisID = 'y1Axis' | 'y2Axis';

export type Metric = {
  axis: YAxisID,
  color: string,
  displayName: string,
  formatValue: (number | null) => string | number,
  id: MetricID,
};

export type GoalLineTheme = {
  backgroundColor: string,
  lineColor: string,
  textStyle: {
    fill: string,
    fontSize: string | number,
    fontWeight: string | number,
  },
};

export type GoalLineData = {
  axis: YAxisID,
  id: string,
  metric: Metric,
  value: number,
};
