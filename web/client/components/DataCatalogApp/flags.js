// @flow
import 'url-search-params-polyfill';

import { IS_ZENYSIS_USER } from 'util/util';

// Flag that indicates whether the data-catalog style query models are being
// used for a site. When this is true, we will use graphql to pull data from the
// database instead of relying on the flask potion endpoints.
// NOTE(stephen): Enabling by default in dev for a small number of engineers.

// NOTE (solo, stephen, yitian): Enable data catalog in development for all
// zenysis users
export const ENABLED_DATA_CATALOG_APP: boolean = IS_ZENYSIS_USER;
