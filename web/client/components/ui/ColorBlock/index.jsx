// @flow
import * as React from 'react';
import BlockPicker from 'react-color/lib/Block';
import classNames from 'classnames';
import type { Color, ColorResult, HSLColor } from 'react-color';

import autobind from 'decorators/autobind';
import { PALETTE_COLOR_ORDER } from 'components/QueryResult/graphUtil';

// Export the react-color types so that the users of ColorBlock get all their
// types from here.
export type { Color, ColorResult };

type Props = {|
  /** Hex color string  or rgba object */
  color: Color,

  /** Does this ColorBlock support a color picker? */
  enableColorPicker: boolean,

  /**
   * If this ColorBlock is a controlled element, this controls whether or not
   * to show it.
   * If `undefined`, then the ColorBlock is uncontrolled.
   * TODO(pablo): this is not a good design. Rethink ColorBlock usage.
   * TODO(pablo): change to a ColorBlock and ColorBlock.Uncontrolled design
   */
  showColorPicker: boolean | void,

  /**
   * Callback when a color is selected from the colorpicker.
   * @param {ColorResult} color Get the hex value from `color.hex`
   */
  onColorChange?: (colorResult: ColorResult) => void,

  /**
   * size in pixels of the color block
   */
  size: number,
|};

type State = {
  showColorPicker: boolean,
};

// Customize the react-color picker to fit our custom colors.
// The default color square width in react-color is 32px
const NUM_SWATCH_COLUMNS = 9;
const SWATCH_WIDTH = 32;
const PICKER_BODY_WIDTH = SWATCH_WIDTH * NUM_SWATCH_COLUMNS;
const PICKER_MARGIN_WIDTH = 10;
const PICKER_WIDTH = `${PICKER_BODY_WIDTH + PICKER_MARGIN_WIDTH}px`;

// From: https://stackoverflow.com/a/31851617
function _hsvToHSL(h: number, s: number, v: number): HSLColor {
  const output = {
    h,
    s: 0,
    l: ((2 - s) * v) / 2,
  };
  if (output.l !== 0) {
    if (output.l < 0.5) {
      output.s = (s * v) / (output.l * 2);
    } else if (output.l !== 1) {
      output.s = (s * v) / (2 - output.l * 2);
    }
  }
  return output;
}

// Convert the union Color type into a valid CSS color string.
// NOTE(stephen): Refining these types is a little cumbersome since it is a
// union of mostly disjoint objects. Checking for the exact properties works,
// however adding a type check (like (color: RGBColor)) does not work.
function buildCSSColor(color: Color): string {
  if (typeof color === 'string') {
    return color;
  }

  const alpha = color.a === undefined ? 1 : color.a;
  if (color.r !== undefined && color.g !== undefined && color.b !== undefined) {
    const { r, g, b } = color;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Conver hsv to hsl if that's what we received.
  let hslColor: HSLColor;
  if (color.v !== undefined && color.s !== undefined && color.h !== undefined) {
    const { h, s, v } = color;
    hslColor = _hsvToHSL(h, s, v);
  } else {
    hslColor = color;
  }

  return `hsla(${hslColor.h}, ${hslColor.s}, ${hslColor.l}, ${alpha})`;
}

/**
 * A ColorBlock component that literally just represents a block of a single
 * color. You can use `enableColorPicker` to allow a color picker to show up
 * when you click on the block.
 *
 * This component is a **controlled** component, meaning that the block's color
 * will _not_ change on its own when a color is selected. You will need to
 * implement an `onColorChange` function to pass in the new color as a prop.
 */
export default class ColorBlock extends React.PureComponent<Props, State> {
  static defaultProps = {
    enableColorPicker: false,
    onColorChange: undefined,
    size: 17,
    showColorPicker: undefined,
  };

  state = {
    showColorPicker: false,
  };

  _colorPickerRef: $RefObject<'div'> = React.createRef();

  componentDidUpdate(prevProps: Props) {
    if (prevProps.enableColorPicker !== this.props.enableColorPicker) {
      // if we're showing the color picker, but the enableColorPicker prop
      // changed to false, then we should hide it
      if (!this.props.enableColorPicker && this.state.showColorPicker) {
        this.hideColorPicker();
      }
    }
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onDocumentClick);
  }

  hideColorPicker() {
    this.setState({ showColorPicker: false });
    document.removeEventListener('click', this.onDocumentClick);
  }

  @autobind
  onColorChange(colorResult: ColorResult) {
    const { onColorChange } = this.props;
    this.hideColorPicker();
    if (onColorChange) {
      onColorChange(colorResult);
    }
  }

  @autobind
  onColorBlockClick() {
    this.setState(
      prevState => ({ showColorPicker: !prevState.showColorPicker }),
      () => {
        if (this.state.showColorPicker) {
          document.addEventListener('click', this.onDocumentClick);
        }
      },
    );
  }

  @autobind
  onDocumentClick(event: Event) {
    const colorPicker = this._colorPickerRef.current;
    if (
      event.target instanceof window.HTMLElement &&
      colorPicker &&
      (colorPicker === event.target || colorPicker.contains(event.target))
    ) {
      // don't hide if we clicked on the color picker
      return;
    }

    this.hideColorPicker();
  }

  maybeRenderColorPicker() {
    // TODO(pablo): x_x this component is a weird mix of controlled and
    // uncontrolled. refactor this
    if (
      this.props.showColorPicker !== true &&
      (!this.state.showColorPicker ||
        !this.props.enableColorPicker ||
        this.props.showColorPicker === false)
    ) {
      return null;
    }

    return (
      <div className="zen-color-block__color-picker" ref={this._colorPickerRef}>
        <BlockPicker
          triangle="hide"
          color={this.props.color}
          colors={PALETTE_COLOR_ORDER}
          width={PICKER_WIDTH}
          onChangeComplete={this.onColorChange}
        />
      </div>
    );
  }

  render() {
    const { color, size, enableColorPicker } = this.props;
    const style = {
      background: buildCSSColor(color),
      height: size,
      width: size,
    };

    const iconClassName = classNames('zen-color-block__icon', {
      'zen-color-block__clickable': enableColorPicker,
    });

    return (
      <div className="zen-color-block">
        <div
          style={style}
          className={iconClassName}
          onClick={this.onColorBlockClick}
          role="button"
        />
        {this.maybeRenderColorPicker()}
      </div>
    );
  }
}
