// @flow
import * as React from 'react';

import type { ColumnCounts } from 'components/visualizations/common/controls/commonTypes';

type Props = ColumnCounts & {
  children: React.Node,

  className: string,
  htmlFor?: string,
  label?: string,
  labelClassName?: string,
};

const defaultColumnCounts = {
  colsControl: 9,
  colsLabel: 3,
  colsWrapper: 12,
};

const defaultProps = {
  ...defaultColumnCounts,
  className: '',
  labelClassName: '',
  displayInline: true,
  htmlFor: undefined,
  label: undefined,
};

/**
 * <Control> represents a single control (e.g. InputText, Dropdown, etc.)
 * grouped together with its label. Controls are placed within a ControlsGroup
 * component. <Control> should not be placed outside a <ControlsGroup> otherwise
 * the css cols will get thrown off.
 */
export default function Control(props: Props) {
  const {
    children,
    label,
    className,
    colsControl,
    colsLabel,
    colsWrapper,
    htmlFor,
    labelClassName,
  } = props;

  let labelCol = null;
  if (label) {
    labelCol = (
      <div className={`col-xs-${colsLabel} label-col`}>
        <label htmlFor={htmlFor} className={labelClassName}>
          {label}
        </label>
      </div>
    );
  }

  return (
    <div className={`col-xs-${colsWrapper} control ${className}`}>
      <div className="row">
        {labelCol}
        <div className={`col-xs-${colsControl} control-col`}>{children}</div>
      </div>
    </div>
  );
}

Control.defaultProps = defaultProps;
Control.defaultColumnCounts = defaultColumnCounts;
