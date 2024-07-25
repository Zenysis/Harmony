// @flow
import * as React from 'react';

import ProgressBar from 'components/ui/ProgressBar';
import QueryResult from 'components/QueryResult';
import useSerializedEmbeddedContent from 'components/EmbeddedQueryApp/hooks/useSerializedEmbeddedContent';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { EmbedRequest } from 'components/EmbeddedQueryApp/types';

type Props = {
  dashboard: $PropertyType<EmbedRequest, 'dashboard'>,
  query: $PropertyType<EmbedRequest, 'query'>,
  smallMode: boolean,
};

function EmbeddedContent({ dashboard, query, smallMode }: Props) {
  const [
    querySelections,
    originalQueryResultSpec,
    viewType,
  ] = useSerializedEmbeddedContent(dashboard, query);
  const [
    queryResultSpec,
    setQueryResultSpec,
  ] = React.useState<QueryResultSpec | void>();

  // When the queryResultSpec is first deserialized, update the value in state.
  React.useEffect(() => {
    setQueryResultSpec(originalQueryResultSpec);
  }, [originalQueryResultSpec]);

  if (
    querySelections === undefined ||
    queryResultSpec === undefined ||
    viewType === undefined
  ) {
    return <ProgressBar enabled />;
  }

  return (
    <QueryResult
      enableMobileMode={false}
      enableWarningMessages
      onQueryResultSpecChange={setQueryResultSpec}
      queryResultSpec={queryResultSpec}
      querySelections={querySelections}
      smallMode={smallMode}
      viewType={viewType}
    />
  );
}

export default (React.memo(EmbeddedContent): React.AbstractComponent<Props>);
