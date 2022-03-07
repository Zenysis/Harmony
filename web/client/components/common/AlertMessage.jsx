// @flow
import * as React from 'react';

type AlertType = 'success' | 'info' | 'warning' | 'danger';
type AlertTypeMap = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'danger',
};

export const ALERT_TYPE: AlertTypeMap = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'danger',
};

type Props = {
  children: React.Node,
  type: AlertType,

  className: string,
  onRequestDismiss?: (SyntheticMouseEvent<HTMLButtonElement>) => void,
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
      type="button"
      className="close"
      aria-label="Close"
      onClick={onRequestDismiss}
    >
      <span aria-hidden="true">&times;</span>
    </button>
  );
}

// Simple component for displaying a message to the user in a block
// TODO(pablo): change CSS class names to be `zen-` prefixed and use BEM
export default function AlertMessage(props: Props): React.Element<'div'> {
  const { children, type, className, onRequestDismiss } = props;
  const fullClassName = `alert alert-message alert-${type} ${className}`;
  return (
    <div className={fullClassName} role="alert">
      {maybeRenderDismissButton(onRequestDismiss)}
      {children}
    </div>
  );
}

AlertMessage.defaultProps = defaultProps;
