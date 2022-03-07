// @flow

export type DataPoint = {
  color: string,
  key: string,
  value: number | null,
};

export type PieChartTheme = {
  displayLabelType: 'percent' | 'raw' | 'both',
  highlightedSegmentStroke: string,
  labelFontColor: string,
  labelFontFamily: string,
  labelFontSize: number,
  titleFontColor: string,
  titleFontFamily: string,
  titleFontSize: number,
};

export type LabelPosition = {
  bottom: number,
  left: number,
  right: number,
  top: number,
};

export type LabelData = {
  key: string,
  displayValue: string,
  position: LabelPosition,
};

// Data types used by VX Pie.
export type ArcData = {
  data: DataPoint,
  endAngle: number,
  padAngle: number,
  startAngle: number,
  value: number,
};

export type ArcPath = {
  (arc: ArcData): string,
  innerRadius: () => () => number,
  outerRadius: () => () => number,
};

export type PieData = {
  arcs: $ReadOnlyArray<ArcData>,
  path: ArcPath,
};
