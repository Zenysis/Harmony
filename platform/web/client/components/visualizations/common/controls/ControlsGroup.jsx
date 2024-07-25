// @flow
import * as React from 'react';

import Spacing from 'components/ui/Spacing';

type Props = {
  children: React.Node,
  className?: string,
};

/**
 * Thin wrapper around a group of controls to provide a standard box view with a
 * fixed width, border and padding.
 */
export default function ControlsGroup({
  children,
  className = '',
}: Props): React.Node {
  return (
    <Spacing
      className={`settings-modal__controls-group ${className}`}
      padding="l"
    >
      {children}
    </Spacing>
  );
}
