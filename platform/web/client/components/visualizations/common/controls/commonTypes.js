// @flow
import type { Color } from 'components/ui/ColorBlock';

export type VisualizationControlProps<T> = {
  activated?: boolean,
  controlKey: string,
  onValueChange: (controlKey: string, value: T | string) => void,
  value: T,
};

export type ColorPickerValueType = Color;
