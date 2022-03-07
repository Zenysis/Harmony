// @flow
import { databaseIdToRelayId } from 'util/graphql/hasura';
import { localizeUrl } from 'util/util';
import { slugify } from 'util/stringUtil';

// Build a URL that will send the user to the field details page for the given
// field ID.
// NOTE(stephen): If we end up with many of these utilities, consider
// centralizing them.
export default function buildFieldDetailsPageLink(
  id: string,
  name: string,
): string {
  const slug = slugify(name);
  const suffix = slug.length > 0 ? `${slug}--${id}` : id;
  return localizeUrl(`/data-catalog/field/${suffix}`);
}

// This method exists for the semi-rare instances where we have the *database*
// field ID instead of the relay field ID. We need to convert the db ID into
// the relay globally unique ID before we can build the link.
// TODO(stephen): Monitor this usage.
export function buildFieldDetailsPageLinkFromDatabaseId(
  dbId: string,
  name: string,
): string {
  const relayId = databaseIdToRelayId(dbId, 'field');
  return buildFieldDetailsPageLink(relayId, name);
}
