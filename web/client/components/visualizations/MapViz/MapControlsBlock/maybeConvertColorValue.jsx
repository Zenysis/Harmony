// @flow
import type { RGBColor } from 'react-color';

import type { ColorPickerValueType } from 'components/visualizations/common/controls/commonTypes';

export default function maybeConvertColorValue(
  color: ColorPickerValueType,
): RGBColor {
  if (typeof color === 'string') {
    const converted = { r: 255, g: 255, b: 255, a: 1 };
    if (color.length >= 7) {
      converted.r = parseInt(color.substr(1, 2), 16);
      converted.g = parseInt(color.substr(3, 2), 16);
      converted.b = parseInt(color.substr(5, 2), 16);
    }
    return converted;
  }
  return color;
}
