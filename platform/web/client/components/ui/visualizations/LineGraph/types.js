// @flow
export type DataPoint = {
  /** The date on which the count was registered */
  date: Date,

  /** The value recorded on the given date */
  value: number,
};

export type DataPointWithName = {
  ...DataPoint,
  seriesDimensions: $ReadOnly<{ [dimensionName: string]: string | null, ... }>,

  /** The name of the time series to which the data point belongs */
  seriesName: string,
};

export type TooltipData = DataPointWithName;

export type VerticalAxisStartPoint = 'zero' | 'min';

export type TimeSeries = {
  data: $ReadOnlyArray<DataPoint>,
  dimensions: $ReadOnly<{ [dimensionName: string]: string | null, ... }>,
  name: string,
};
