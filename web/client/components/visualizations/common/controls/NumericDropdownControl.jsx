// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import DropdownControl from 'components/visualizations/common/controls/DropdownControl';

type DropdownControlProps = {
  ...$Diff<React.ElementConfig<typeof DropdownControl>, { children: mixed }>,
};

type Props = {
  ...DropdownControlProps,
  maxValue?: number,
  minValue?: number,
};

export default function NumericDropdownControl({
  controlKey,
  onValueChange,
  value,
  ariaName = undefined,
  buttonMinWidth = undefined,
  buttonWidth = undefined,
  className = '',
  label = '',
  labelClassName = '',
  maxValue = 10,
  menuWidth = '100%',
  minValue = 1,
  showButtonContentsOnHover = false,
  valueStyle = undefined,
}: Props): React.Node {
  const dropdownOptions: Array<React.Element<typeof Dropdown.Option>> = [];
  for (let i = minValue; i < maxValue + 1; i++) {
    dropdownOptions.push(
      <Dropdown.Option key={i} value={i}>
        {i}
      </Dropdown.Option>,
    );
  }

  return (
    <DropdownControl
      ariaName={ariaName}
      buttonMinWidth={buttonMinWidth}
      buttonWidth={buttonWidth}
      className={className}
      controlKey={controlKey}
      label={label}
      labelClassName={labelClassName}
      menuWidth={menuWidth}
      onValueChange={onValueChange}
      showButtonContentsOnHover={showButtonContentsOnHover}
      value={value}
      valueStyle={valueStyle}
    >
      {dropdownOptions}
    </DropdownControl>
  );
}
