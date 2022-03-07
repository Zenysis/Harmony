// @flow
import * as React from 'react';

import useSerializedEmbeddedDashboard from 'components/EmbeddedQueryApp/hooks/useSerializedEmbeddedDashboard';
import useSerializedEmbeddedQuery from 'components/EmbeddedQueryApp/hooks/useSerializedEmbeddedQuery';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { EmbedRequest } from 'components/EmbeddedQueryApp/types';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

export default function useSerializedEmbeddedContent(
  dashboard: $PropertyType<EmbedRequest, 'dashboard'>,
  query: $PropertyType<EmbedRequest, 'query'>,
): [QuerySelections | void, QueryResultSpec | void, ResultViewType | void] {
  if (dashboard !== undefined) {
    return useSerializedEmbeddedDashboard(dashboard);
  }

  if (query !== undefined) {
    return useSerializedEmbeddedQuery(query);
  }

  return [undefined, undefined, undefined];
}
