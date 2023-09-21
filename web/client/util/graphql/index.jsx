// @flow
import environment from 'util/graphql/environment';
import zenEnvironment from 'util/graphql/zen_environment';
import {
  databaseIdToRelayId,
  relayIdToDatabaseId,
  relayIdToDatabaseNumberId,
  relayIdToDatabaseIdV2,
  relayIdToDatabaseNumberIdV2,
} from 'util/graphql/hasura';

export {
  environment,
  databaseIdToRelayId,
  relayIdToDatabaseId,
  relayIdToDatabaseNumberId,
  relayIdToDatabaseIdV2,
  relayIdToDatabaseNumberIdV2,
  zenEnvironment,
};
