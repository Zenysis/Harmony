// @flow
import Promise from 'bluebird';
import { fetchQuery } from 'relay-runtime';

import Dimension from 'models/core/wip/Dimension';
import DimensionService, {
  AuthorizedDimensionService,
} from 'services/wip/DimensionService';
import LinkedCategory from 'models/core/wip/LinkedCategory';
import { environment, relayIdToDatabaseId } from 'util/graphql';
import type { Cache, RejectFn, ResolveFn } from 'services/wip/CachedMapService';
import type { patchDimensionServiceQueryResponse } from './__generated__/patchDimensionServiceQuery.graphql';

const DIMENSION_QUERY = graphql`
  query patchDimensionServiceQuery {
    dimensionConnection: dimension_connection {
      edges {
        node {
          id
          description
          name

          dimensionCategoryMappings: dimension_category_mappings {
            category: dimension_category {
              id
              name
            }
          }
        }
      }
    }
  }
`;

function buildDimensionCache(
  resolve: ResolveFn<Dimension>,
  reject: RejectFn,
): Promise<Cache<Dimension>> {
  return Promise.resolve(fetchQuery(environment, DIMENSION_QUERY, {}))
    .then((data: patchDimensionServiceQueryResponse) => {
      const dimensionMappingCache = {};
      data.dimensionConnection.edges.forEach(({ node }) => {
        const { id, description, name } = node;

        // NOTE(stephen): All dimensions have exactly one category RIGHT NOW.
        // This might change in the future. But hopefully in that future we
        // won't be patching services anymore and will live in GraphQL land.
        const serializedCategory = node.dimensionCategoryMappings[0].category;

        // TODO(stephen): Should we reuse the same category object if it was
        // already created for a different dimension?
        const category = LinkedCategory.create({
          id: relayIdToDatabaseId(serializedCategory.id),
          name: serializedCategory.name,
        });

        const dimensionId = relayIdToDatabaseId(id);
        dimensionMappingCache[dimensionId] = Dimension.fromObject({
          category,
          description: description || '',
          id: dimensionId,
          name,
        });
      });

      resolve(dimensionMappingCache);
      return dimensionMappingCache;
    })
    .catch(reject);
}

// Patch the DimensionService to use a GraphQL relay query instead of making a
// call to an AQT Flask-Potion endpoint.
export default function patchDimensionService() {
  // $FlowExpectedError[cannot-write]
  DimensionService.buildCache = buildDimensionCache;

  // TODO(stephen, yitian): Figure out how to handle PII dimensions. It is not
  // yet part of the Data Catalog design.
  // $FlowExpectedError[cannot-write]
  AuthorizedDimensionService.buildCache = buildDimensionCache;
}
