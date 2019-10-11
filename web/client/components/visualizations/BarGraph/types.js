// @flow
export type DataPoint = {
  key: string,
  [string]: number,
};

export type BarValue = {
  cumulativePercent: number,
  label: string,
  x: number,
  y: number | null,
};

export type BarSeries = {
  key: string,
  total: number,
  values: $ReadOnlyArray<BarValue>,

  // The second y axis uses lines instead of a second set of bars.
  // If a field was chosen to be displayed on the second y axis, mark
  // the data item as "not a bar" and NVD3 will pick up on it.
  bar: boolean,

  // Data sort order is needed by the tooltip.
  dataSortOrder: string,

  // Don't remove a field's data when it is disabled, just mark it
  // as disabled and NVD3 will pick up on it. This lets the animations be
  // smoother.
  disabled: boolean,

  // We have to set the stroke width for lines on each data item instead
  // of specifying it at the chart level for all lines.
  strokeWidth: number | void,

  // Designate whether the series should have its values displayed on
  // the chart and pass over any value display options.
  showValues: boolean,
  valueFontSize: string,
};
