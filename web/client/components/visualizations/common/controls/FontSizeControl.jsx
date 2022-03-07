// @flow
import * as React from 'react';

import DropdownControl from 'components/visualizations/common/controls/DropdownControl';
import { getFontDropdownOptions } from 'components/visualizations/util/settingsUtil';

type DropdownControlProps = {
  ...$Diff<
    React.ElementConfig<typeof DropdownControl>,
    { children: mixed, valueStyle: mixed },
  >,
};

type Props = {
  ...DropdownControlProps,
  maxFontSize: number,
  minFontSize: number,

  ariaName?: string,
};

// TODO(david): Deprecate this and just use the NumericDropdownControl when we
// have converted all the viz settings to store font sizes as numbers rather
// than strings (e.g. 12 vs '12px')
export default function FontSizeControl({
  controlKey,
  minFontSize,
  maxFontSize,
  value,
  onValueChange,
  ariaName = undefined,
  buttonMinWidth = undefined,
  buttonWidth = 60,
  label = '',
  labelClassName = '',
  menuWidth = '100%',
  className = '',
  showButtonContentsOnHover = false,
}: Props): React.Node {
  const fontOptions = getFontDropdownOptions(minFontSize, maxFontSize);
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
      {fontOptions}
    </DropdownControl>
  );
}
