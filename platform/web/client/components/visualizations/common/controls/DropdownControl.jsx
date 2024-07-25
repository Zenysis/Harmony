// @flow
import * as React from 'react';

import Control from 'components/visualizations/common/controls/Control';
import Dropdown from 'components/ui/Dropdown';
import type { StyleObject } from 'types/jsCore';
import type { VisualizationControlProps } from 'components/visualizations/common/controls/commonTypes';

type Props<T: string | number> = {
  ...VisualizationControlProps<T>,
  ariaName?: string,
  buttonMinWidth?: number,
  buttonWidth?: string | number,
  children: React.ChildrenArray<?React.Element<Class<Dropdown.Option<T>>>>,
  className?: string,
  label?: string,
  labelClassName?: string,
  menuMaxWidth?: number,
  menuMinWidth?: number,
  menuWidth?: string,
  showButtonContentsOnHover?: boolean,
  valueStyle?: StyleObject | void,
};

export default function DropdownControl<T: string | number>({
  children,
  controlKey,
  onValueChange,
  value,
  ariaName = undefined,
  buttonMinWidth = undefined,
  buttonWidth = '50%',
  label = '',
  labelClassName = '',
  menuWidth = '100%',
  menuMaxWidth = undefined,
  menuMinWidth = undefined,
  className = '',
  showButtonContentsOnHover = false,
  valueStyle = undefined,
}: Props<T>): React.Node {
  const onChange = val => onValueChange(controlKey, val);

  return (
    <Control
      className={`dropdown-control ${className}`}
      label={label}
      labelClassName={labelClassName}
    >
      <Dropdown
        ariaName={ariaName}
        buttonMinWidth={buttonMinWidth}
        buttonWidth={buttonWidth}
        menuMaxWidth={menuMaxWidth}
        menuMinWidth={menuMinWidth}
        menuWidth={menuWidth}
        onSelectionChange={onChange}
        showButtonContentsOnHover={showButtonContentsOnHover}
        value={value}
        valueStyle={valueStyle}
      >
        {children}
      </Dropdown>
    </Control>
  );
}

export const { Option } = Dropdown;
