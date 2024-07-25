// @flow
import * as React from 'react';

import DashboardSessionService from 'services/DashboardBuilderApp/DashboardSessionService';
import { cancelPromise } from 'util/promiseUtil';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

/**
 * When the dashboard is first opened, fetch any dashboard session modifiers
 * that should be applied.
 */
export default function useDashboardSessionModifiers(): [
  $ReadOnlyArray<QueryFilterItem> | void,
  $ReadOnlyArray<GroupingItem> | void,
  boolean,
] {
  const [filters, setFilters] = React.useState(undefined);
  const [groupings, setGroupings] = React.useState(undefined);
  const [sessionLoaded, setSessionLoaded] = React.useState(false);

  React.useEffect(() => {
    const sessionModifierHash = window.location.hash.split('#h=')[1];
    if (sessionModifierHash === undefined) {
      setSessionLoaded(true);
      return;
    }

    const promise = DashboardSessionService.getDashboardSession(
      sessionModifierHash,
    )
      .then(response => {
        const sessionData = response.dataBlob();
        setFilters(sessionData.filters);
        setGroupings(sessionData.groupings);
      })
      .finally(() => {
        // We always want to mark the session as loaded, even if there was a
        // failure to actually fetch the session, because it is more important
        // to show the dashboard than to block showing the dashboard *only* due
        // to the failure of loading a dashboard session.
        setSessionLoaded(true);
      });

    // eslint-disable-next-line consistent-return
    return () => cancelPromise(promise);
  }, []);

  return [filters, groupings, sessionLoaded];
}
