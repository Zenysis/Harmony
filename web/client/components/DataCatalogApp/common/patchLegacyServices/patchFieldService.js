// @flow
import Promise from 'bluebird';
import { fetchQuery } from 'relay-runtime';

import Field from 'models/core/wip/Field';
import FieldService from 'services/wip/FieldService';
import { environment, relayIdToDatabaseId } from 'util/graphql';
import type { Cache, RejectFn, ResolveFn } from 'services/wip/CachedMapService';
import type { patchFieldServiceQueryResponse } from './__generated__/patchFieldServiceQuery.graphql';

const FIELD_QUERY = graphql`
  query patchFieldServiceQuery {
    fieldConnection: field_connection {
      edges {
        node {
          id
          name
          serializedCalculation: calculation
          shortName: short_name
        }
      }
    }
  }
`;

function buildFieldCache(
  resolve: ResolveFn<Field>,
  reject: RejectFn,
): Promise<Cache<Field>> {
  return Promise.resolve(fetchQuery(environment, FIELD_QUERY, {}))
    .then((data: patchFieldServiceQueryResponse) => {
      const fieldMappingCache = {};
      data.fieldConnection.edges.forEach(({ node }) => {
        const { id, name, serializedCalculation, shortName } = node;
        const fieldId = relayIdToDatabaseId(id);
        fieldMappingCache[fieldId] = Field.UNSAFE_deserialize({
          id: fieldId,
          canonicalName: name,
          calculation: serializedCalculation,
          shortName,
        });
      });

      resolve(fieldMappingCache);
      return fieldMappingCache;
    })
    .catch(reject);
}

// Patch the FieldMetadataService to use a GraphQL relay query instead of making a
// call to an AQT Flask-Potion endpoint.
export default function patchFieldService() {
  // $FlowExpectedError[cannot-write]
  FieldService.buildCache = buildFieldCache;
}
