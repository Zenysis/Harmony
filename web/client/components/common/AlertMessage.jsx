// @flow
import * as React from 'react';

type AlertType = 'success' | 'info' | 'warning' | 'danger';
type AlertTypeMap = {
  ERROR: 'danger',
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
};

export const ALERT_TYPE: AlertTypeMap = {
  ERROR: 'danger',
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
};

type Props = {
  children: React.Node,
  className: string,
  onRequestDismiss?: (SyntheticMouseEvent<HTMLButtonElement>) => void,
  type: AlertType,
};

const defaultProps = {
  className: '',
  onRequestDismiss: undefined,
};

// Only render the dismiss button if an event handler is defined
function maybeRenderDismissButton(
  onRequestDismiss?: (SyntheticMouseEvent<HTMLButtonElement>) => void,
) {
  if (!onRequestDismiss) {
    return null;
  }

  return (
    <button
      aria-label="Close"
      className="close"
      onClick={onRequestDismiss}
      type="button"
    >
      <span aria-hidden="true">&times;</span>
    </button>
  );
}

// Simple component for displaying a message to the user in a block
// TODO: change CSS class names to be `zen-` prefixed and use BEM
export default function AlertMessage(props: Props): React.Element<'div'> {
  const { children, className, onRequestDismiss, type } = props;
  const fullClassName = `alert alert-message alert-${type} ${className}`;
  return (
    <div className={fullClassName} role="alert">
      {maybeRenderDismissButton(onRequestDismiss)}
      {children}
    </div>
  );
}

AlertMessage.defaultProps = defaultProps;
