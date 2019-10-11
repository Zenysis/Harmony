// @flow
/* eslint-disable react/no-unused-prop-types */
import * as React from 'react';

type Props = {
  value: string,

  children: React.Node,
  className: string,
  disabled: boolean,
};

const defaultProps = {
  children: null,
  className: '',
  disabled: false,
};

/**
 * Used in <Radio> or <Checkbox>
 * CheckableItem just returns the children, but its main use is to contain
 * the user-defined value, which then gets wrapped and accessed by
 * CheckableItemWrapper
 */
export default function CheckableItem(props: Props) {
  const { children, disabled } = props;
  const disabledModifier = disabled ? 'disabled' : '';
  const baseClass = 'checkable-item__item-content';
  return (
    <div className={`${baseClass} ${baseClass}--${disabledModifier}`}>
      {children}
    </div>
  );
}

CheckableItem.defaultProps = defaultProps;
