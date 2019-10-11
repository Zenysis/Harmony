// @flow
import * as React from 'react';

import Control from 'components/visualizations/common/controls/Control';
import Dropdown from 'components/ui/Dropdown';
import type { StyleObject } from 'types/jsCore';
import type { VisualizationControlProps } from 'components/visualizations/common/controls/commonTypes';

type Props<T: string | number> = VisualizationControlProps<T> & {
  children: React.ChildrenArray<?React.Element<Class<Dropdown.Option<T>>>>,
  label: string,

  buttonMinWidth?: number,
  buttonWidth?: number,
  className: string,
  dropdownClassName: string,
  valueStyle: StyleObject | void,
};

const defaultProps = {
  ...Control.defaultColumnCounts,
  buttonMinWidth: undefined,
  buttonWidth: undefined,
  className: '',
  dropdownClassName: '',
  valueStyle: undefined,
};

export default function DropdownControl<T: string | number>(props: Props<T>) {
  const {
    children,
    controlKey,
    onValueChange,
    value,
    buttonMinWidth,
    buttonWidth,
    className,
    dropdownClassName,
    valueStyle,
    ...passThroughControlProps
  } = props;
  const onChange = val => onValueChange(controlKey, val);

  return (
    <Control
      className={`dropdown-control ${className}`}
      {...passThroughControlProps}
    >
      <Dropdown
        value={value}
        onSelectionChange={onChange}
        className={dropdownClassName}
        buttonMinWidth={buttonMinWidth}
        buttonWidth={buttonWidth}
        valueStyle={valueStyle}
      >
        {children}
      </Dropdown>
    </Control>
  );
}

DropdownControl.defaultProps = defaultProps;

export const { Option } = Dropdown;
