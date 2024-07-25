// @flow
import AuthorizationService from 'services/AuthorizationService';
import useOneTimeRequest from 'components/DashboardBuilderApp/hooks/useOneTimeRequest';
import {
  RESOURCE_TYPES,
  SITE_PERMISSIONS,
} from 'services/AuthorizationService/registry';

const LOAD_QUERY_FORM_AUTH = () =>
  AuthorizationService.isAuthorized(
    SITE_PERMISSIONS.VIEW_QUERY_FORM,
    RESOURCE_TYPES.SITE,
  );

/**
 * Load permissions to view the query form *exactly once per page* and return
 * the results.
 */
export default function useCanViewQueryForm(): boolean {
  return useOneTimeRequest(false, LOAD_QUERY_FORM_AUTH);
}
