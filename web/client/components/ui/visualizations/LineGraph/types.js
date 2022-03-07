// @flow
export type DataPoint = {
  /** The value recorded on the given date */
  value: number,

  /** The date on which the count was registered */
  date: Date,
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
  name: string,
  dimensions: $ReadOnly<{ [dimensionName: string]: string | null, ... }>,
  data: $ReadOnlyArray<DataPoint>,
};
