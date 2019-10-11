// @flow
export type AxisCategory = 'xAxis' | 'yAxis';
export type XAxisType = 'xAxis';
export type YAxisType = 'y1Axis' | 'y2Axis';
export type AxisType = XAxisType | YAxisType;

// TODO(pablo): eventually stop importing these constants and only import
// the objects AXIS_TYPES and AXIS_CATEGORIES
export const X_AXIS = 'xAxis';
export const Y_AXIS = 'yAxis';
export const Y1_AXIS = 'y1Axis';
export const Y2_AXIS = 'y2Axis';

type AxisTypesMap = {
  X_AXIS: 'xAxis',
  Y1_AXIS: 'y1Axis',
  Y2_AXIS: 'y2Axis',
}

export const AXIS_TYPES: AxisTypesMap = {
  X_AXIS,
  Y1_AXIS,
  Y2_AXIS,
};

export const AXIS_CATEGORIES: { [string]: AxisCategory } = {
  X_AXIS,
  Y_AXIS,
};
