// @flow
import * as React from 'react';

import DashboardLocalStorageService from 'services/DashboardBuilderApp/DashboardLocalStorageService';
import type DashboardSpecification from 'models/core/Dashboard/DashboardSpecification';

/**
 * This hook loads in any unsaved dashboard spec changes that we have stored in
 * LocalStorage.
 */
export default function useLocalStorageDashboardSpec(
  dashboardURI: string,
): [DashboardSpecification | void, boolean] {
  const [
    cachedDashboardSpec,
    setCachedDashboardSpec,
  ] = React.useState<DashboardSpecification | void>(undefined);

  const [loaded, setLoaded] = React.useState<boolean>(false);

  React.useEffect(() => {
    DashboardLocalStorageService.getDashboardSpec(dashboardURI)
      .then(spec => {
        DashboardLocalStorageService.removeDashboardSpec(dashboardURI);
        setCachedDashboardSpec(spec === null ? undefined : spec);
      })
      .finally(() => {
        // We always want to mark the spec as loaded, even if there was a
        // failure to actually fetch it, because it is more important to show
        // the dashboard than to block showing the dashboard *only* due
        // to the failure of load locally stored unsaved changes.
        setLoaded(true);
      });
  }, [dashboardURI]);

  return [cachedDashboardSpec, loaded];
}
