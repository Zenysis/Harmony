// @flow
import * as React from 'react';

import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';

type DropdownControlProps = $Diff<
  React.ElementConfig<typeof DropdownControl>,
  { children: mixed, valueStyle: mixed },
>;

type Props = DropdownControlProps;

// Mapping from font display name to font family.
const FONT_OPTIONS = {
  Arial: 'Arial',
  'Sans Serif': 'Lato',
  Serif: 'Times New Roman',
  'Courier New': 'Courier New, monospace',
};

export default function FontFamilyControl({
  controlKey,
  value,
  onValueChange,
  ariaName = undefined,
  buttonMinWidth = undefined,
  buttonWidth = undefined,
  label = '',
  labelClassName = '',
  menuWidth = '100%',
  className = '',
  showButtonContentsOnHover = false,
}: Props): React.Node {
  const fontFamilyOptions = Object.keys(FONT_OPTIONS).map(displayName => (
    <Option
      key={displayName}
      style={{ fontFamily: FONT_OPTIONS[displayName], fontSize: 16 }}
      value={FONT_OPTIONS[displayName]}
    >
      {displayName}
    </Option>
  ));
  return (
    <DropdownControl
      controlKey={controlKey}
      value={value}
      onValueChange={onValueChange}
      ariaName={ariaName}
      buttonMinWidth={buttonMinWidth}
      buttonWidth={buttonWidth}
      label={label}
      labelClassName={labelClassName}
      menuWidth={menuWidth}
      className={className}
      showButtonContentsOnHover={showButtonContentsOnHover}
      valueStyle={{ fontFamily: value }}
    >
      {fontFamilyOptions}
    </DropdownControl>
  );
}
