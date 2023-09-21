// @flow
import 'url-search-params-polyfill';

// Flag that indicates whether the data-catalog style query models are being
// used for a site. When this is true, we will use graphql to pull data from the
// database instead of relying on the flask potion endpoints.
// NOTE: Enabling by default in dev for a small number of engineers.

export const ENABLED_DATA_CATALOG_APP: boolean = true;
