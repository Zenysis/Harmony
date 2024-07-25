// @flow
export type Margin = {
  bottom: number,
  left: number,
  right: number,
  top: number,
};

// Data model of each of the data point in each category
export type BinDataPoint = {
  /** The number of data points with this value */
  count: number,

  /** The value of the data point */
  value: number,
};

// essential numbers required to draw the BoxPlot and the outliers
export type BoxPlotSummary = {|
  firstQuartile: number,

  /** Max value before considering outliers. */
  max: number,

  median: number,

  /** Min value before considering outliers */
  min: number,

  thirdQuartile: number,
|};

export type BoxPlotDataPoint = {
  dimensions: {
    +[dimensionID: string]: string | null,
    ...,
  },
  value: number,
};

// Data for a single box in the box plot visualization (which can contain many
// boxes)
export type BoxPlotBoxData = {
  data: {
    /** All points that lie in the current category excluding outliers */
    binData: $ReadOnlyArray<BinDataPoint>,

    /** Essential points to draw the BoxPlot and outliers */
    boxPlotSummary: BoxPlotSummary,

    /**
     * Numbers below (firstQuartile-1.5*IQR) and numbers above
     * (1.5*IQR + firstQuartile) where IQR is Inter Quartile Range
     */
    outliers: $ReadOnlyArray<BoxPlotDataPoint>,
  },

  /** The name of the category */
  key: string,
};

export type BoxTooltipData = {
  boxPlotSummary: BoxPlotSummary,
  dimensionValue: string,
  left: number,
  top: number,
};

export type OutlierTooltipData = {
  dataPoint: BoxPlotDataPoint,
  dimensionValue: string,
  left: number,
  top: number,
};

export type ViolinPatternMap = {
  all: 'all',
  diagonal: 'diagonal',
  horizontal: 'horizontal',
  horizontalAndDiagonal: 'horizontalAndDiagonal',
  horizontalAndVertical: 'horizontalAndVertical',
  vertical: 'vertical',
  verticalAndDiagonal: 'verticalAndDiagonal',
};

export type ViolinPatternsNames = $Keys<ViolinPatternMap>;
