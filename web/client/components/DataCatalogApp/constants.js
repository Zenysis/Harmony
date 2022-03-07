// @flow
import { databaseIdToRelayId } from 'util/graphql';

// This is the ID for the special root category that is the ancestor of all
// categories on the site.
// NOTE(stephen): This category *must exist in the database*. It also must be
// kept in sync with the backend's definition of the root category.
export const ROOT_CATEGORY_ID: string = databaseIdToRelayId('root', 'category');
