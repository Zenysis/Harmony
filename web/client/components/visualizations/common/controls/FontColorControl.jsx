// @flow
// NOTE(stephen): This control is a generalized color control and it is not
// restricted just to fonts. Rename it to ColorControl.
import * as React from 'react';
import type { ColorResult } from 'react-color';

import Caret from 'components/ui/Caret';
import ColorBlock from 'components/ui/ColorBlock';
import Control from 'components/visualizations/common/controls/Control';
import autobind from 'decorators/autobind';
import type {
  ColorPickerValueType,
  VisualizationControlProps,
} from 'components/visualizations/common/controls/commonTypes';

type Props<T: ColorPickerValueType> = VisualizationControlProps<T> & {
  className: string,
  includeTransparent: boolean,
  label: string,
  labelClassName: string,
};

type State = {
  showColorPicker: boolean,
};

export default class FontColorControl<
  T: ColorPickerValueType,
> extends React.PureComponent<Props<T>, State> {
  static defaultProps = {
    ...Control.defaultColumnCounts,
    className: '',
    labelClassName: '',
    includeTransparent: false,
  };

  state = {
    showColorPicker: false,
  };

  _ref: $RefObject<'div'> = React.createRef();

  componentWillUnmount() {
    document.removeEventListener('click', this.syntheticBlur);
  }

  // Simulate "onBlur" with non-blurrable elements. When the user clicks outside
  // of the color block menu, trigger a closing of the menu content.
  // TODO(stephen): This behavior is very common and it would be good to create
  // a reusable way to do this work.
  @autobind
  syntheticBlur(event: MouseEvent) {
    const { current } = this._ref;
    if (!current) {
      return;
    }

    const { target } = event;
    if (target instanceof window.Node && !current.contains(target)) {
      this.closeColorPicker();
    }
  }

  closeColorPicker() {
    document.removeEventListener('click', this.syntheticBlur);
    this.setState({ showColorPicker: false });
  }

  openColorPicker() {
    document.addEventListener('click', this.syntheticBlur);
    this.setState({ showColorPicker: true });
  }

  @autobind
  onColorChange(colorObject: ColorResult) {
    const { onValueChange, controlKey, includeTransparent } = this.props;
    if (includeTransparent) {
      // $FlowFixMe - RGBColor is a valid type to pass to the callback.
      onValueChange(controlKey, colorObject.rgb);
    } else {
      onValueChange(controlKey, colorObject.hex);
    }
  }

  @autobind
  onToggleColorPicker() {
    if (this.state.showColorPicker) {
      this.closeColorPicker();
    } else {
      this.openColorPicker();
    }
  }

  render() {
    const {
      value,
      className,
      includeTransparent,
      labelClassName,
      ...passThroughControlProps
    } = this.props;
    const { showColorPicker } = this.state;
    const activeClassName = showColorPicker
      ? 'color-control__color-block--active'
      : '';
    return (
      <Control
        className={`color-control ${className}`}
        labelClassName={labelClassName}
        {...passThroughControlProps}
      >
        <div
          className={`color-control__color-block ${activeClassName}`}
          onClick={this.onToggleColorPicker}
          ref={this._ref}
          role="button"
        >
          <ColorBlock
            color={value}
            showColorPicker={showColorPicker}
            onColorChange={this.onColorChange}
            size={20}
          />
          <Caret className="color-control__caret" />
        </div>
      </Control>
    );
  }
}
