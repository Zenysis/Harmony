// @flow
import * as React from 'react';

import SessionTimeoutService from 'services/ui/SessionTimeoutService';

/**
 * A hook to provide a callback that will be called when a user session times
 * out.
 */
export default function useSessionTimeout(
  onSessionTimeout: (event: Event) => void,
): void {
  React.useEffect(() => {
    const sessionTimeoutSubscription = SessionTimeoutService.subscribe(
      onSessionTimeout,
    );

    return () => SessionTimeoutService.unsubscribe(sessionTimeoutSubscription);
  }, [onSessionTimeout]);
}
