// @flow
import * as React from 'react';
import { fetchQuery } from 'react-relay/hooks';
import type { ConcreteRequest } from 'relay-runtime';

import { environment } from 'util/graphql';

/**
 * This hook allows refetching of graphQL queries in a way that will not suspend.
 * See https://relay.dev/docs/guided-tour/refetching/refreshing-queries/ for
 * more info.
 *
 * @param {ConcreteRequest} graphQLRequest A graphQL request that can be executed
 * (query, fragment, etc).
 * @returns {[boolean, () => void]} Whether the query is fetching and a function to
 * refetch the data.
 */
export default function useNoSuspenseRefetch(
  graphQLRequest: ConcreteRequest,
): [boolean, () => void] {
  const [refetchedQueryOptions, setRefetchedQueryOptions] = React.useState<{
    fetchKey: number,
    fetchPolicy: string,
  } | null>(null);
  const [isRefetching, setIsRefetching] = React.useState<boolean>(false);

  const refetch = React.useCallback(() => {
    if (isRefetching) {
      return;
    }
    setIsRefetching(true);

    fetchQuery(
      environment,
      graphQLRequest,
      refetchedQueryOptions || {},
    ).subscribe({
      complete: () => {
        setIsRefetching(false);

        // *After* the query has been fetched, we update our state to re-render
        // with the new fetchKey and fetchPolicy. At this point the data for the
        // query should be cached, so we use the 'store-only' fetchPolicy to avoid
        // suspending.
        setRefetchedQueryOptions(prev => ({
          fetchKey: (prev?.fetchKey ?? 0) + 1,
          fetchPolicy: 'store-only',
        }));
      },
      error: () => {
        setIsRefetching(false);
      },
    });
  }, [graphQLRequest, isRefetching, refetchedQueryOptions]);

  return [isRefetching, refetch];
}
