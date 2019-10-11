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
export type BoxPlotSummary = {
  thirdQuartile: number,

  /** Min value before considering outliers */
  min: number,

  /** Max value before considering outliers. */
  max: number,
  median: number,
  firstQuartile: number,
};

// Category Data whose Box Plot is to be drawn
export type BoxPlotData = {
  data: {
    /** All points that lie in the current category excluding outliers */
    binData: $ReadOnlyArray<BinDataPoint>,

    /** Essential points to draw the BoxPlot and outliers */
    boxPlotSummary: BoxPlotSummary,

    /**
     * Numbers below (firstQuartile-1.5*IQR) and numbers above
     * (1.5*IQR + firstQuartile) where IQR is Inter Quartile Range
     */
    outliers: $ReadOnlyArray<number>,
  },

  /** The name of the category */
  key: string,
};

export type Accessors = {
  getMin?: (d: BoxPlotData) => number,
  getMax?: (d: BoxPlotData) => number,
  getOutliers?: (d: BoxPlotData) => $ReadOnlyArray<number>,
};

export type XScale = (category: string) => number;

export type YScale = (value: number) => number;

export type TooltipData = {
  name: string,
  min?: number,
  max?: number,
  median?: number,
  firstQuartile?: number,
  thirdQuartile?: number,
};

export type ViolinPatternsNames =
  | 'horizontal'
  | 'vertical'
  | 'diagonal'
  | 'all'
  | 'horizontalAndDiagonal'
  | 'horizontalAndVertical'
  | 'verticalAndDiagonal';
