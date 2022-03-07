// @flow
import * as React from 'react';
import classNames from 'classnames';

import Alert from 'components/ui/Alert';

type Props = {
  /** The intent for this toast */
  intent: 'none' | 'success' | 'error' | 'warning',

  /** An optional callback that when triggered will close the toast */
  onClose: () => void,

  /** Is the Toast currently open? */
  open: boolean,

  /** The Toast's title */
  title: string,

  /** An optional description to show under the title */
  description?: React.Node,

  /** The duration the toast will be visible */
  duration?: number | void,

  /** Should the toast have a close button the user can click */
  hasCloseButton?: boolean,

  /** Override the default z-index that the toast will render at */
  zIndex?: number | void,
};

function startCloseTimer(
  duration: number | void,
  onClose: () => void,
): TimeoutID | void {
  if (duration === undefined || duration === 0) {
    return undefined;
  }

  return setTimeout(() => onClose(), duration * 1000);
}

function Toast({
  intent,
  onClose,
  open,
  title,

  description = null,
  duration = undefined,
  hasCloseButton = true,
  zIndex = undefined,
}: Props) {
  // Store the actual alert height so we can animate to it.
  const [alertHeight, setAlertHeight] = React.useState<number>(0);

  // Track whether the toast has already opened once so we can change the
  // animation state.
  const [hasOpened, setHasOpened] = React.useState<boolean>(false);

  // Track the timeout created that will trigger the closing of the Toast.
  const timeoutRef = React.useRef();

  // If a timeout is still set when this component is unmounting, clear it.
  React.useEffect(() => {
    timeoutRef.current = startCloseTimer(duration, onClose);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [duration, onClose]);

  // When the Toast block first renders, capture the height of the alert that is
  // going to be animated in.
  const onRefChange = React.useCallback(elt => {
    if (elt) {
      setAlertHeight(elt.getBoundingClientRect().height);
      setHasOpened(true);
    }
  }, []);

  // If the user starts hovering over the toast, cancel the "close" timeout that
  // is set. If the user stops hovering over the toast, reset it (if allowed).
  const onMouseLeave = React.useCallback(() => {
    timeoutRef.current = startCloseTimer(duration, onClose);
  }, [duration, onClose]);

  const onMouseEnter = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  const className = classNames('ui-toast', {
    'ui-toast--exiting': !open && hasOpened,
    'ui-toast--open': open,
  });

  return (
    <div
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        height: alertHeight,
        marginBottom: open ? 0 : -alertHeight,
        zIndex,
      }}
    >
      <div className="ui-toast__block" ref={onRefChange}>
        <Alert
          card
          className="ui-toast__content"
          intent={intent}
          onRemove={hasCloseButton ? onClose : undefined}
          title={title}
        >
          {description}
        </Alert>
      </div>
    </div>
  );
}

export default (React.memo(Toast): React.AbstractComponent<Props>);
