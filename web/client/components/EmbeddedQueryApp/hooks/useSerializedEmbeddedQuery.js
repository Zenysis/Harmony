// @flow
import * as React from 'react';
import Promise from 'bluebird';

import QueryResultSpec from 'models/core/QueryResultSpec';
import QuerySelections from 'models/core/wip/QuerySelections';
import type {
  EmbeddedQuery,
  QueryResultPieces,
} from 'components/EmbeddedQueryApp/types';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

/**
 * Deserialize an embedded AQT query.
 */
export default function useSerializedEmbeddedQuery(
  query: EmbeddedQuery,
): [QuerySelections | void, QueryResultSpec | void, ResultViewType | void] {
  const [
    querySelections,
    setQuerySelections,
  ] = React.useState<QuerySelections | void>();
  const [
    queryResultSpec,
    setQueryResultSpec,
  ] = React.useState<QueryResultSpec | void>();

  React.useEffect(() => {
    QuerySelections.deserializeAsync(query.querySelections).then(result => {
      setQuerySelections(result);
      setQueryResultSpec(QueryResultSpec.deserialize(query.queryResultSpec));
    });
  }, []);

  return [querySelections, queryResultSpec, query.viewType];
}
