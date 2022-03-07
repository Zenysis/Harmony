// @flow
import * as React from 'react';
import { useLazyLoadQuery } from 'react-relay/hooks';

import { relayIdToDatabaseId } from 'util/graphql/hasura';
import type { useDatasourceLookupQuery } from './__generated__/useDatasourceLookupQuery.graphql';

export default function useDatasourceLookup(): string => string {
  const data = useLazyLoadQuery<useDatasourceLookupQuery>(
    graphql`
      query useDatasourceLookupQuery {
        pipelineDatasourceConnection: pipeline_datasource_connection {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    `,
    {},
  );

  const datasourceMapping = React.useMemo(() => {
    const mapping = {};
    data.pipelineDatasourceConnection.edges.forEach(row => {
      if (row.node.name) {
        const id = relayIdToDatabaseId(row.node.id);
        mapping[id] = row.node.name;
      }
    });
    return mapping;
  }, [data]);

  return (source: string) => datasourceMapping[source] || source;
}
