// @flow
import * as React from 'react';

import InputText from 'components/ui/InputText';
import { NO_COLOR_BACKGROUND } from 'components/ui/ColorBlock/constants';

type Props = {
  color: string | null,
  onColorChange: (color: string, closePicker: boolean) => void,
  onColorRemove: (() => void) | void,
  palette: $ReadOnlyArray<string>,
  columns?: number,
  swatchSpacing?: number,
  swatchSize?: number,
};

const TEXT = t('ui.ColorBlock.ColorPicker');
const VALID_HEX_COLOR_INPUT = new RegExp('^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$');
const NO_COLOR_SWATCH_STYLE = {
  background: NO_COLOR_BACKGROUND,
  border: '1px solid #bfc2c9',
};

/**
 * This is a grid based color picker with an input text box for directly setting
 * a custom color.
 */
function ColorPicker({
  color,
  onColorChange,
  onColorRemove,
  palette,
  columns = 9,
  swatchSpacing = 10,
  swatchSize = 22,
}: Props) {
  const onColorInputChange = React.useCallback(
    (rawValue: string) => {
      const value = rawValue.trim();
      if (!VALID_HEX_COLOR_INPUT.test(value)) {
        return;
      }

      // If this is a short hex code, convert it to a long hex code.
      let colorValue = value.toUpperCase();
      if (value.length === 4) {
        const [, r, g, b] = value.split('');
        colorValue = `#${r}${r}${g}${g}${b}${b}`;
      }
      onColorChange(colorValue, false);
    },
    [onColorChange],
  );
  const onColorInputBlur = React.useCallback(
    (event: SyntheticEvent<HTMLInputElement>) => {
      if (event.type === 'blur' && event.target instanceof HTMLInputElement) {
        // eslint-disable-next-line no-param-reassign
        event.target.value = color || '';
      }
    },
    [color],
  );

  const colorBlockStyle = {
    gridAutoRows: swatchSize,
    gridColumnGap: swatchSpacing,
    gridRowGap: swatchSpacing,
    gridTemplateColumns: `repeat(${columns}, ${swatchSize}px)`,
  };
  return (
    <div className="ui-color-picker">
      {color !== null && (
        <div
          className="ui-color-picker__title-block"
          style={{ backgroundColor: color }}
        >
          <div className="ui-color-picker__title">{color.toLowerCase()}</div>
        </div>
      )}
      <div className="ui-color-picker__color-block" style={colorBlockStyle}>
        {palette.map(paletteColor => (
          <div
            className="ui-color-picker__color-swatch"
            key={paletteColor}
            onClick={() => onColorChange(paletteColor, true)}
            style={{ backgroundColor: paletteColor }}
            role="button"
          />
        ))}
        {onColorRemove !== undefined && (
          <div
            className="ui-color-picker__color-swatch"
            onClick={onColorRemove}
            role="button"
            style={NO_COLOR_SWATCH_STYLE}
          />
        )}
      </div>
      <div className="ui-color-picker__input-block">
        <InputText.Uncontrolled
          ariaName={TEXT.hexColor}
          className="ui-color-picker__input"
          debounce
          initialValue={color || ''}
          onBlur={onColorInputBlur}
          onChange={onColorInputChange}
        />
      </div>
    </div>
  );
}

export default (React.memo(ColorPicker): React.AbstractComponent<Props>);
