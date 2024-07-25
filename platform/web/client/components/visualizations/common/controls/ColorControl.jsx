// @flow
import * as React from 'react';

import Caret from 'components/ui/Caret';
import ColorBlock from 'components/ui/ColorBlock';
import Control from 'components/visualizations/common/controls/Control';
import type {
  ColorPickerValueType,
  VisualizationControlProps,
} from 'components/visualizations/common/controls/commonTypes';
import type { ColorResult } from 'components/ui/ColorBlock';

type Props<T: ColorPickerValueType> = {
  ...
    | { ...VisualizationControlProps<T>, enableNoColor: false }
    | {
        ...VisualizationControlProps<T | null>,
        enableNoColor: true,
      },
  className?: string,
  includeTransparent?: boolean,
  label: string,
  labelClassName?: string,
};

export default function ColorControl<T: ColorPickerValueType>({
  className = '',
  controlKey,
  enableNoColor,
  includeTransparent = false,
  label,
  labelClassName = '',
  onValueChange,
  value,
}: Props<T>): React.Node {
  const onColorChange = (colorObject: ColorResult) => {
    if (includeTransparent) {
      // $FlowIssue[incompatible-call] - RGBColor is a valid type to pass to the callback.
      onValueChange(controlKey, colorObject.rgb);
    } else {
      onValueChange(controlKey, colorObject.hex);
    }
  };

  const onColorRemove = () => {
    if (enableNoColor) {
      // $FlowIssue[incompatible-call] - undefined is always valid when enableNoColor is true
      onValueChange(controlKey, null);
    }
  };

  return (
    <Control
      className={`color-control ${className}`}
      label={label}
      labelClassName={labelClassName}
    >
      <div className="color-control__color-block" role="button">
        <ColorBlock
          color={value}
          enableColorPicker
          onColorChange={onColorChange}
          onColorRemove={enableNoColor ? onColorRemove : undefined}
          shape="circle"
          size={20}
        />
        <Caret className="color-control__caret" />
      </div>
    </Control>
  );
}
