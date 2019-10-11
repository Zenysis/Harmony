// @flow
import type { HexColor, RGBColor } from 'react-color';

export type ColumnCounts = {
  colsControl: number, // number of css cols for actual control
  colsLabel: number, // number of css cols for label
  colsWrapper: number, // number of css cols for control wrapper
};

export type VisualizationControlProps<T> = $Merge<
  ColumnCounts,
  {
    controlKey: string,
    onValueChange: (controlKey: string, value: T | string) => void,
    value: T,
  },
>;

export type ColorPickerValueType = HexColor | RGBColor;
