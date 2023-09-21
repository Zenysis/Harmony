// @flow
import {
  Environment,
  Network,
  Observable,
  RecordSource,
  Store,
} from 'relay-runtime';
import type {
  DataID,
  GraphQLResponse,
  MissingFieldHandler,
  NormalizationLinkedField,
  RequestParameters,
  Variables,
} from 'relay-runtime';

function fetchQuery(
  request: RequestParameters,
  variables: Variables,
): Observable<GraphQLResponse> {
  const result = fetch('/api/graphql', {
    body: JSON.stringify({
      variables,
      query: request.text,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  }).then(response => response.json());
  return Observable.from(result);
}

const missingLinkedFieldHandler: MissingFieldHandler = {
  handle: (
    field: NormalizationLinkedField,
    record: mixed,
    args: Variables,
  ): ?DataID => {
    // See if the `node` field is being searched. If it is, there should be a
    // `id` parameter supplied (since that's how you query `node(id: ID!)`). We
    // should be able to safely return the `id` argument as the new value relay
    // should search for in the cache. We can do this safely because 1) the
    // `id` property in relay is *globally unique*, and 2) relay will still
    // check to see if the shape of the field being requested is actually fully
    // in the store. If not, relay will still query the server to get all the
    // properties that are needed (which is good!).
    if (field.name === 'node' && typeof args.id === 'string') {
      return args.id;
    }

    return undefined;
  },
  kind: 'linked',
};

const environment: Environment = new Environment({
  missingFieldHandlers: [missingLinkedFieldHandler],
  network: Network.create(fetchQuery),
  store: new Store(new RecordSource(), { gcReleaseBufferSize: 10 }),
});

export default environment;
