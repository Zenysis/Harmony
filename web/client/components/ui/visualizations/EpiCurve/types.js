// @flow
export type DataPoint = {
  /** The number of cases corresponding to the data point */
  value: number,

  /** The date at which the number of cases where recorded */
  date: Date,
};

export type Bin = {
  /** The number of values in the bin */
  valuesCount: number,

  /** The lower limit of the bin */
  lowerBinLimit: number | Date,

  /** The upper limit of the bin */
  upperBinLimit: number | Date,
};

export type HistogramData = {
  /** Intervals of data with corresponding count of values win each interval */
  bins: $ReadOnlyArray<Bin>,

  /** The minimum value of all lower bin limit of the bins */
  lowerBound: number | Date,

  /** The maximum value of all upper bin limits of the bins */
  upperBound: number | Date,
};

export type Margin = {
  top: number,
  left: number,
  right: number,
  bottom: number,
};

export type DateAccessor = ({ date: Date }) => Date;

export type TooltipData = {
  /** The lower limit of a bin to be shown in the tooltip */
  from: Date,

  /** The upper limit of the bin to be shown in the tooltip */
  to: Date,
};
