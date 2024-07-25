// @flow
// NOTE: This control is a generalized color control and it is not
// restricted just to fonts. Rename it to ColorControl.
import * as React from 'react';
import Alpha from 'react-color/lib/Alpha';
import type { ColorResult } from 'react-color';

import Control from 'components/visualizations/common/controls/Control';
import autobind from 'decorators/autobind';
import type {
  ColorPickerValueType,
  VisualizationControlProps,
} from 'components/visualizations/common/controls/commonTypes';

type DefaultProps = {
  className: string,
  includeTransparent: boolean,
  labelClassName: string,
};

type Props<T: ColorPickerValueType> = {
  ...DefaultProps,
  ...VisualizationControlProps<T>,
  label: string,
};

export default class BackgroundOpacityControl<
  T: ColorPickerValueType,
> extends React.PureComponent<Props<T>> {
  static defaultProps: DefaultProps = {
    className: '',
    includeTransparent: false,
    labelClassName: '',
  };

  @autobind
  onColorChange(colorObject: ColorResult) {
    const { controlKey, includeTransparent, onValueChange } = this.props;
    if (includeTransparent) {
      // $FlowIssue[incompatible-call] - RGBColor is a valid type to pass to the callback.
      onValueChange(controlKey, colorObject.rgb);
    } else {
      onValueChange(controlKey, colorObject.hex);
    }
  }

  maybeRenderAlphaControl(): React.Node {
    const { includeTransparent, value } = this.props;
    if (!includeTransparent) {
      return null;
    }
    return <Alpha color={value} onChange={this.onColorChange} />;
  }

  render(): React.Node {
    const {
      activated,
      className,
      controlKey,
      includeTransparent,
      labelClassName,
      onValueChange,
      value,
      ...passThroughControlProps
    } = this.props;
    return (
      <Control
        className={`color-control ${className}`}
        labelClassName={labelClassName}
        {...passThroughControlProps}
      >
        {this.maybeRenderAlphaControl()}
      </Control>
    );
  }
}
