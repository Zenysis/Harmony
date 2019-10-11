// @flow
import * as React from 'react';

type Props = {
  children: React.Node, // Children must be Control, or return Control
  className: string,
};

const defaultProps = {
  children: null,
  className: '',
};

/**
 * ControlsGroup represents a row of controls
 */
export default function ControlsGroup(props: Props) {
  const { children, className } = props;
  if (!children) {
    return null;
  }

  return (
    <div className={`row controls-group-container ${className}`}>
      {children}
    </div>
  );
}

ControlsGroup.defaultProps = defaultProps;
