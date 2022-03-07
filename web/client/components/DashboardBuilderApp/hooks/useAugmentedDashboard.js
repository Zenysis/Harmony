// @flow
import * as React from 'react';

import useDashboardSessionModifiers from 'components/DashboardBuilderApp/hooks/useDashboardSessionModifiers';
import useLocalStorageDashboardSpec from 'components/DashboardBuilderApp/hooks/useLocalStorageDashboardSpec';
import type Dashboard from 'models/core/Dashboard';

/**
 * Apply any unsvaed changes that we want to load to the dashboard when the app
 * first loads. These include modifiers from a shared dashboard session as well
 * as unsaved changes that we have stored when a session has timed out.
 */
export default function useAugmentedDashboard(
  dashboardUri: string,
  lastSavedDashboard: Dashboard | void,
): [Dashboard | void, (Dashboard) => void] {
  // TODO(david): Currently we only fetch the filter and grouping items. We
  // should fix this to also include the excluded tiles
  const [filters, groupings, modifiersLoaded] = useDashboardSessionModifiers();
  const [
    localStorageDashboardSpec,
    localStorageDashboardSpecLoaded,
  ] = useLocalStorageDashboardSpec(dashboardUri);

  const [
    currentDashboard,
    setCurrentDashboard,
  ] = React.useState<Dashboard | void>(undefined);

  // NOTE(stephen): We only want this to run *once* per page load. Augmented
  // dashboard data should only be applied on top of the very first dashboard
  // loaded. Any time the lastSavedDashboard changes *after* the first load,
  // it is because there was a save event triggered.
  const firstDashboardLoadRef = React.useRef(true);

  // NOTE(stephen, david): Intentionally excluding the session `filters` and
  // `groupings` as well as `localStorageDashboardSpec` from the dependency list
  // because we only care about their first value after they have loaded.
  React.useEffect(() => {
    if (
      lastSavedDashboard === undefined ||
      !modifiersLoaded ||
      !localStorageDashboardSpecLoaded
    ) {
      return;
    }

    // Any time the last saved dashboard changes, we need to unset any changes
    // made by the user to the dashboard and replace them with the saved
    // dashboard.
    if (!firstDashboardLoadRef.current) {
      setCurrentDashboard(lastSavedDashboard);
      return;
    }

    // We only apply these unsaved changes once so set the tracking ref to
    // false.
    firstDashboardLoadRef.current = false;

    let updatedDashboard = lastSavedDashboard;

    // First apply any locally cached version of the dashboard specification
    if (localStorageDashboardSpec !== undefined) {
      updatedDashboard = updatedDashboard.specification(
        localStorageDashboardSpec,
      );
    }

    // Then apply any dashboard session on top.
    if (filters !== undefined || groupings !== undefined) {
      const commonSettings = updatedDashboard.specification().commonSettings();
      const filterSettings = commonSettings.filterSettings();
      const groupingSettings = commonSettings.groupingSettings();
      const updatedFilterSettings = {
        ...filterSettings,
        items:
          filters !== undefined
            ? filters
            : commonSettings.filterSettings().items,
      };

      const updatedGroupingSettings = {
        ...groupingSettings,
        items:
          groupings !== undefined
            ? groupings
            : commonSettings.groupingSettings().items,
      };

      updatedDashboard = updatedDashboard
        .deepUpdate()
        .specification()
        .commonSettings()
        .modelValues({
          filterSettings: updatedFilterSettings,
          groupingSettings: updatedGroupingSettings,
        });
    }

    setCurrentDashboard(updatedDashboard);
  }, [modifiersLoaded, lastSavedDashboard]); // eslint-disable-line react-hooks/exhaustive-deps

  return [currentDashboard, setCurrentDashboard];
}
