// @flow
import * as React from 'react';

import AuthorizationService from 'services/AuthorizationService';
import {
  DASHBOARD_PERMISSIONS,
  RESOURCE_TYPES,
} from 'services/AuthorizationService/registry';
import { IS_LEGACY_EXPERIENCE } from 'components/DashboardBuilderApp/constants';
import { cancelPromise } from 'util/promiseUtil';

/**
 * Load the authorization state for the user for the provided dashboard. Return
 * whether the user is an administrator and if they are an editor.
 */
export default function useDashboardAuthorization(
  dashboardSlug: string,
): [boolean, boolean] {
  // HACK(stephen): If the user is in the legacy experience, we mark them as
  // having no permissions at all. Since this is a constant, we can violate the
  // rules of hooks just a little bit here since we are not causing hook order
  // to change (since we can never make it outside this block).
  /* eslint-disable react-hooks/rules-of-hooks */
  if (IS_LEGACY_EXPERIENCE) {
    return [false, false];
  }

  const [isAdministrator, setIsAdministrator] = React.useState<boolean>(false);
  const [isEditor, setIsEditor] = React.useState<boolean>(false);

  // Fetch the authorization result for all of the required checks needed for
  // the dashboard. This should happen on dashboard load only (or technically if
  // the slug changes, but that is not possible).
  React.useEffect(() => {
    const promise = AuthorizationService.isAuthorizedMulti([
      {
        permission: DASHBOARD_PERMISSIONS.UPDATE_USERS,
        resourceName: dashboardSlug,
        resourceType: RESOURCE_TYPES.DASHBOARD,
      },
      {
        permission: DASHBOARD_PERMISSIONS.EDIT,
        resourceName: dashboardSlug,
        resourceType: RESOURCE_TYPES.DASHBOARD,
      },
    ]).then(([adminAuthorization, editorAuthorization]) => {
      setIsAdministrator(adminAuthorization.authorized);
      setIsEditor(editorAuthorization.authorized);
    });

    return () => cancelPromise(promise);
  }, [dashboardSlug]);

  return [isAdministrator, isEditor];
}
