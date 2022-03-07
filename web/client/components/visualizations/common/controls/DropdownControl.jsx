// @flow
import * as React from 'react';

import Control from 'components/visualizations/common/controls/Control';
import Dropdown from 'components/ui/Dropdown';
import type { StyleObject } from 'types/jsCore';
import type { VisualizationControlProps } from 'components/visualizations/common/controls/commonTypes';

type Props<T: string | number> = {
  ...VisualizationControlProps<T>,
  children: React.ChildrenArray<?React.Element<Class<Dropdown.Option<T>>>>,

  ariaName?: string,
  buttonMinWidth?: number,
  buttonWidth?: string | number,
  className?: string,
  label?: string,
  labelClassName?: string,
  menuWidth?: string,
  menuMaxWidth?: number,
  menuMinWidth?: number,
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
      labelClassName={labelClassName}
      label={label}
    >
      <Dropdown
        ariaName={ariaName}
        value={value}
        onSelectionChange={onChange}
        buttonMinWidth={buttonMinWidth}
        buttonWidth={buttonWidth}
        valueStyle={valueStyle}
        showButtonContentsOnHover={showButtonContentsOnHover}
        menuWidth={menuWidth}
        menuMaxWidth={menuMaxWidth}
        menuMinWidth={menuMinWidth}
      >
        {children}
      </Dropdown>
    </Control>
  );
}

export const { Option } = Dropdown;
