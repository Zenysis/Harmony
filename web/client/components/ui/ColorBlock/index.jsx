// @flow
import * as React from 'react';
import classNames from 'classnames';

import ColorPicker from 'components/ui/ColorBlock/internal/ColorPicker';
import Popover from 'components/ui/Popover';
import autobind from 'decorators/autobind';
import normalizeARIAName from 'components/ui/util/normalizeARIAName';
import {
  DEFAULT_PALETTE,
  NO_COLOR_BACKGROUND,
} from 'components/ui/ColorBlock/constants';

export type HexColor = string;
export type RGBColor = { r: number, g: number, b: number, a?: number };

export type Color = HexColor | RGBColor;
export type ColorResult = {
  hex: HexColor,
  rgb: RGBColor,
};

type DefaultProps = {
  /**
   * The accessibility name for this color block. If none is specified, we
   * will default to 'color block'.
   */
  ariaName?: string,

  /** Does this ColorBlock support a color picker? */
  enableColorPicker: boolean,

  /**
   * Callback when a color is selected from the colorpicker.
   * @param {ColorResult} color Get the hex value from `color.hex`
   */
  onColorChange?: (colorResult: ColorResult) => void,

  /**
   * Callback when a color is removed. If no callback is provided, then the
   * color is not removable.
   */
  onColorRemove?: (() => void) | void,

  /** The color options to display */
  palette: $ReadOnlyArray<string>,

  /** Shape of the color block */
  shape: 'circle' | 'square',

  /** Size in pixels of the color block */
  size: number,
  testId?: string,
};

type Props = {
  ...DefaultProps,

  /** Hex color string or RGB(a) color object */
  color: HexColor | RGBColor | null,
};

type State = {
  showColorPicker: boolean,
};

const _hex = (value: number) =>
  Math.round(value)
    .toString(16)
    .padStart(2, '0');
function buildHexColor(color: RGBColor): string {
  const alpha = color.a !== undefined ? _hex(color.a * 255) : '';
  return `#${_hex(color.r)}${_hex(color.g)}${_hex(color.b)}${alpha}`;
}

function buildRGBColor(color: HexColor): RGBColor {
  return {
    r: Number.parseInt(color.substr(1, 2), 16),
    g: Number.parseInt(color.substr(3, 2), 16),
    b: Number.parseInt(color.substr(5, 2), 16),
    a: color.length === 9 ? Number.parseInt(color.substr(7, 2), 16) : undefined,
  };
}

const TEXT = t('ui.ColorBlock');

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
  static defaultProps: DefaultProps = {
    ariaName: undefined,
    enableColorPicker: false,
    onColorChange: undefined,
    onColorRemove: undefined,
    palette: DEFAULT_PALETTE,
    shape: 'square',
    size: 17,
    testId: undefined,
  };

  state: State = {
    showColorPicker: false,
  };

  _ref: $ElementRefObject<'div'> = React.createRef();

  componentDidUpdate(prevProps: Props) {
    if (prevProps.enableColorPicker !== this.props.enableColorPicker) {
      // if we're showing the color picker, but the enableColorPicker prop
      // changed to false, then we should hide it
      if (!this.props.enableColorPicker && this.state.showColorPicker) {
        this.onCloseColorBlock();
      }
    }
  }

  @autobind
  onColorChange(hexColor: HexColor, closeColorBlock: boolean = false) {
    const { onColorChange } = this.props;
    if (onColorChange) {
      onColorChange({ hex: hexColor, rgb: buildRGBColor(hexColor) });
    }

    if (closeColorBlock) {
      this.onCloseColorBlock();
    }
  }

  @autobind
  onColorRemove() {
    const { onColorRemove } = this.props;
    if (onColorRemove) {
      onColorRemove();
    }

    this.onCloseColorBlock();
  }

  @autobind
  onCloseColorBlock() {
    this.setState({ showColorPicker: false });
  }

  @autobind
  onOpenColorBlock(event: SyntheticMouseEvent<HTMLDivElement>) {
    const { current } = this._ref;
    const { target } = event;
    if (!current || !(target instanceof Node) || !current.contains(target)) {
      return;
    }
    this.setState({ showColorPicker: true });
  }

  maybeRenderColorPicker(hexColor: HexColor | null): React.Node {
    const { enableColorPicker, onColorRemove, palette } = this.props;
    if (!enableColorPicker) {
      return null;
    }

    return (
      <Popover
        anchorElt={this._ref.current}
        containerType={Popover.Containers.EMPTY}
        isOpen={this.state.showColorPicker}
        onRequestClose={this.onCloseColorBlock}
        keepInWindow
      >
        <div className="zen-color-block__color-picker">
          <ColorPicker
            color={hexColor}
            onColorChange={this.onColorChange}
            onColorRemove={
              onColorRemove !== undefined ? this.onColorRemove : undefined
            }
            palette={palette}
          />
        </div>
      </Popover>
    );
  }

  render(): React.Element<'div'> {
    const {
      ariaName,
      color,
      enableColorPicker,
      shape,
      size,
      testId,
    } = this.props;
    const hexColor =
      typeof color === 'object' && color !== null
        ? buildHexColor(color)
        : color;
    const style = {
      background: hexColor !== null ? hexColor : NO_COLOR_BACKGROUND,
      borderRadius: shape === 'circle' ? '50%' : 0,
      height: size,
      width: size,
    };

    const iconClassName = classNames('zen-color-block__icon', {
      'zen-color-block__clickable': enableColorPicker,
      'zen-color-block__icon--no-color': color === null,
    });

    return (
      <div
        ref={this._ref}
        aria-label={normalizeARIAName(ariaName || TEXT.colorBlock)}
        className="zen-color-block"
        onClick={this.onOpenColorBlock}
        role="button"
        data-testid={testId}
      >
        <div
          data-testid="zen-inner-color-block"
          className={iconClassName}
          style={style}
        />
        {this.maybeRenderColorPicker(hexColor)}
      </div>
    );
  }
}
