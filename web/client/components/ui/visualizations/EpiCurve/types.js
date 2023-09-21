// @flow
export type DimensionID = string;
export type MetricID = string;

export type DataPoint = {
  /* all dimensions except the bucketing grouping */
  dimensions: {
    +[DimensionID]: string | null,
    ...,
  },
  metrics: {
    +[MetricID]: number | null,
    ...,
  },
};

/* Data for the bars in one bin grouping */
export type Bucket = {
  bars: $ReadOnlyArray<DataPoint>,

  /* Dimension for bucketing the data points */
  timestamp: string,
};

export type AxisTitles = {
  xAxis: string,
  yAxis: string,
};

export type AxisTickLabelProps = {
  angle: number,
  dx: string,
  dy: string,
  fill: string,
  fontSize: number | string,
  textAnchor: 'start' | 'middle' | 'end',
  verticalAnchor: 'start' | 'middle' | 'end',
};

export type AxisTheme = {
  tickLabelProps: AxisTickLabelProps,
  titleLabelProps: {
    fill: string,
    fontSize: number | string,
  },
};

export type BarStyle = {
  fill: string,
  fillOpacity: number,
  stroke: string,
  strokeOpacity: number,
};

export type EpiCurveTheme = {
  barStyle: BarStyle,
  valueAngle: number,
  valueFontSize: number | string,
  xAxis: AxisTheme,
  yAxis: AxisTheme,
};

export type Padding = {
  bottom: number,
  left: number,
  right: number,
  top: number,
};
