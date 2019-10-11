import React from 'react';
import PropTypes from 'prop-types';

import PropDefs from 'util/PropDefs';

export const ALERT_TYPE = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'danger',
};

const ALERT_TYPES = [
  ALERT_TYPE.SUCCESS,
  ALERT_TYPE.INFO,
  ALERT_TYPE.WARNING,
  ALERT_TYPE.ERROR,
];

const propDefs = PropDefs.create('alertMessage')
  .propTypes({
    children: PropTypes.node.isRequired,
    type: PropTypes.oneOf(ALERT_TYPES).isRequired,

    className: PropTypes.string,
    onRequestDismiss: PropTypes.func, // f(event)
  })
  .defaultProps({
    className: '',
    onRequestDismiss: null,
  });

// Only render the dismiss button if an event handler is defined
function maybeRenderDismissButton(onRequestDismiss = null) {
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
export default function AlertMessage({
  children,
  type,
  className,
  onRequestDismiss,
}) {
  const fullClassName = `alert alert-message alert-${type} ${className}`;
  return (
    <div className={fullClassName} role="alert">
      {maybeRenderDismissButton(onRequestDismiss)}
      {children}
    </div>
  );
}

PropDefs.setComponentProps(AlertMessage, propDefs);
