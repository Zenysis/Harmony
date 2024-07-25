// @flow
import { getQueryParam } from 'util/util';

// Flag to indicate whether the user is in the temporary legacy dashboard
// view-only mode.
export const IS_LEGACY_EXPERIENCE: boolean = getQueryParam('legacy') === '1';
