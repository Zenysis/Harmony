// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import DropdownControl from 'components/visualizations/common/controls/DropdownControl';

type DropdownControlProps = {
  ...$Diff<React.ElementConfig<typeof DropdownControl>, { children: mixed }>,
};

type Props = {
  ...DropdownControlProps,
  minValue?: number,
  maxValue?: number,
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
      valueStyle={valueStyle}
    >
      {dropdownOptions}
    </DropdownControl>
  );
}
