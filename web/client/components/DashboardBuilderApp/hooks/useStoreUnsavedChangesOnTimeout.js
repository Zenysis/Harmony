// @flow
import * as React from 'react';

import DashboardLocalStorageService from 'services/DashboardBuilderApp/DashboardLocalStorageService';
import useSessionTimeout from 'services/ui/SessionTimeoutService/useSessionTimeout';
import type Dashboard from 'models/core/Dashboard';

/**
 * Store any unsaved currentDashboard spec changes on session timeout.
 */
export default function useStoreUnsavedChangesOnTimeout(
  currentDashboard: Dashboard | void,
  lastSavedDashboard: Dashboard | void,
): void {
  const onSessionTimeout = React.useCallback(() => {
    if (currentDashboard && currentDashboard !== lastSavedDashboard) {
      DashboardLocalStorageService.saveDashboardSpec(currentDashboard);
    }
  }, [currentDashboard, lastSavedDashboard]);

  useSessionTimeout(onSessionTimeout);
}
