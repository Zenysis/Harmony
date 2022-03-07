// @flow
// This file stores methods that are specific to the Hasura implementation of
// Relay-GraphQL. Sometimes, we need to pierce the abstraction that Relay
// provides to work around limitations in Hasura's beta implementation.

/**
 * This method will convert the ID provided by Hasura to Relay into the true
 * ID that is stored in the database. Sometimes, we have to talk to Hasura with
 * the Database IDs (like in `where` or `set` clauses). I'm hopeful that
 * Milestone v1.4 of Hasura will make this unnecessary.
 */
export function relayIdToDatabaseId(relayId: string): string {
  return JSON.parse(atob(relayId))[3];
}

/**
 * Convert a raw database ID value into a globally unique Relay ID value. This
 * method requires the user to specify the correct database table name and is
 * somewhat unsafe.
 * NOTE(yitian): JSON.stringify on an array does not preserve the spaces between
 * items. Therefore, we stringify the individual strings and manually create our
 # own finalized string e.g. '[1, "public", "field", "b1_actual_unit_cost_me"]'.
 */
export function databaseIdToRelayId(dbId: string, dbTable: string): string {
  return btoa(
    `[1, "public", ${JSON.stringify(dbTable)}, ${JSON.stringify(dbId)}]`,
  );
}
