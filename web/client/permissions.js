// @flow
import memoizeOne from 'memoize-one';

import Field from 'models/core/Field';
import type User from 'services/models/User';

const SITE_ROLE = 'SITE';
const VIEW_ONLY_TAG = 'view_only';
const WEBSITE_RESOURCE = 'website';

/**
 * Users are blocked from exporting data if they have the SITE_VIEWER user role.
 */
function _fetchSiteViewerInfo(
  getUser: string => Promise<Array<User>>,
  username: string,
): Promise<boolean> {
  return getUser(username).then(userObj => {
    // If the user does not have any site roles set then they are implicitly
    // allowed to export data.
    const siteRoles = userObj.roles().get(SITE_ROLE, undefined);
    if (siteRoles === undefined) {
      return true;
    }

    // If the user does not have a website resource set then they are implicitly
    // allowed to export data.
    const websiteResources = siteRoles
      .resources()
      .get(WEBSITE_RESOURCE, undefined);
    if (websiteResources === undefined) {
      return true;
    }

    // If the VIEW_ONLY_TAG is set in the website resource then the user is
    // **not** allowed to export data.
    //
    return websiteResources.indexOf(VIEW_ONLY_TAG) === -1;
  });
}

// Memoize the call so that we only fetch the user's data once *per session*.
export const fetchSiteViewerInfo = memoizeOne(_fetchSiteViewerInfo);

