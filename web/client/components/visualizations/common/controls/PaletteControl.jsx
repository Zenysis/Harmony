// @flow
import * as React from 'react';

import ColorBlock from 'components/ui/ColorBlock';
import Control from 'components/visualizations/common/controls/Control';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import InfoTooltip from 'components/ui/InfoTooltip';

type Props = {
  // The defaulte palette that should always be selectable in the color picker.
  defaultPalette: $ReadOnlyArray<string>,

  // The currently selected color palette..
  palette: $ReadOnlyArray<string>,

  // The new palette selected by the user.
  onPaletteChange: ($ReadOnlyArray<string>) => void,

  className?: string,
  label?: string,
  labelTooltip?: string | void,
};

export default function PaletteControl({
  defaultPalette,
  palette,
  onPaletteChange,

  className = '',
  label = I18N.text('Color palette'),
  labelTooltip = undefined,
}: Props): React.Element<typeof Control> {
  // Create the list of colors that will be selectable by the color block.
  // Include the default colors that the ColorBlock supports along with the
  // custom colors specified in the props.
  const colorBlockPalette = React.useMemo(
    () => ColorBlock.defaultProps.palette.concat(defaultPalette),
    [defaultPalette],
  );

  const onPaletteColorChange = React.useCallback(
    (newColor: string, idx: number) => {
      // NOTE(stephen): This shouldn't happen, but just to be safe, make sure we
      // don't write out of bounds in the array.
      if (idx >= palette.length) {
        return;
      }

      const newPalette = palette.slice();
      newPalette[idx] = newColor;
      onPaletteChange(newPalette);
    },
    [onPaletteChange, palette],
  );

  const controlLabel = (
    <Group.Horizontal spacing="none">
      {label}
      {labelTooltip && <InfoTooltip text={labelTooltip} />}
    </Group.Horizontal>
  );

  return (
    <Control className={className} label={controlLabel}>
      <Group.Horizontal spacing="s">
        {palette.map((color, idx) => (
          <ColorBlock
            color={color}
            enableColorPicker
            onColorChange={({ hex }) => onPaletteColorChange(hex, idx)}
            key={`${color}--${idx}`} // eslint-disable-line react/no-array-index-key
            palette={colorBlockPalette}
          />
        ))}
      </Group.Horizontal>
    </Control>
  );
}
