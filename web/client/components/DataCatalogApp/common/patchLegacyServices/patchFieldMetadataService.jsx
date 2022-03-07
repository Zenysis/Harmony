// @flow
import Promise from 'bluebird';
import { fetchQuery } from 'relay-runtime';

import Dataset from 'models/core/wip/Dataset';
import Dimension from 'models/core/wip/Dimension';
import FieldMetadata from 'models/core/wip/FieldMetadata';
import FieldMetadataService from 'services/wip/FieldMetadataService';
import LinkedCategory from 'models/core/wip/LinkedCategory';
import { environment, relayIdToDatabaseId } from 'util/graphql';
import type { Cache, RejectFn, ResolveFn } from 'services/wip/CachedMapService';
import type { patchFieldMetadataServiceQueryResponse } from './__generated__/patchFieldMetadataServiceQuery.graphql';

const DUMMY_DATASOURCE = Dataset.create({ id: '', name: '' });

const FIELD_METADATA_QUERY = graphql`
  query patchFieldMetadataServiceQuery {
    fieldConnection: field_connection {
      edges {
        node {
          id
          calculation
          description
          fieldDimensionMappings: field_dimension_mappings {
            dimension {
              id
              name
            }
          }
          fieldCategoryMappings: field_category_mappings {
            category {
              id
              name
            }
          }
          fieldPipelineDatasourceMappings: field_pipeline_datasource_mappings {
            pipelineDatasource: pipeline_datasource {
              id
              name
            }
          }
        }
      }
    }
    categoryConnection: category_connection {
      edges {
        node {
          id
          name
          parent {
            id
          }
        }
      }
    }
  }
`;

type RawCategory = {|
  +id: string,
  +name: string,
  +parent?: {
    +id: string,
  },
|};

type CategoryCache = { [id: string]: LinkedCategory };

type RawCategoryMapping = {
  [id: string]: {
    id: string,
    parent: ?{
      id: string,
    },
    name: string,
  },
};

type FieldPipelineDatasourceMapping = $ReadOnlyArray<{|
  +pipelineDatasource: {|
    +id: string,
    +name: string,
  |},
|}>;

// Helper function that recursively builds the parent linked category.
function _buildCategoryHelper(
  rawCategoryMapping: RawCategoryMapping,
  categoryId: string | void,
  categoryCache: CategoryCache,
): LinkedCategory | void {
  // If this category has no ID, we're done.
  if (!categoryId) {
    return undefined;
  }

  // If category has already been created, return from cache.
  if (categoryCache[categoryId]) {
    return categoryCache[categoryId];
  }

  const curRawCategory = rawCategoryMapping[categoryId];
  const parentCategoryId = curRawCategory.parent
    ? curRawCategory.parent.id
    : undefined;

  // In the case the parent category id is the same as its own id, return from
  // cache. This should in theory never happen, but adding this check in case.
  if (parentCategoryId === categoryId) {
    return categoryCache[categoryId];
  }

  // Create the linked parent category.
  const parentCategory = _buildCategoryHelper(
    rawCategoryMapping,
    parentCategoryId,
    categoryCache,
  );

  // Deserialize the raw category now that we have the full parent object.
  const category = LinkedCategory.create({
    id: curRawCategory.id,
    name: curRawCategory.name,
    parent: parentCategory,
  });

  // Memoize our work as we go.
  // eslint-disable-next-line no-param-reassign
  categoryCache[categoryId] = category;
  return category;
}

// Recursively build a linked category from the query results.
function buildCategory(
  rawCategoryMapping: RawCategoryMapping,
  category: RawCategory,
  categoryCache: CategoryCache,
): LinkedCategory {
  const { id, name, parent } = category;
  const categoryId = relayIdToDatabaseId(id);

  // If category has already been created, return from cache.
  if (categoryCache[categoryId]) {
    return categoryCache[categoryId];
  }

  const parentId = parent ? parent.id : undefined;

  // Create a linked category object and recursively create the parent category.
  const linkedCategory = LinkedCategory.create({
    id: categoryId,
    name,
    parent: _buildCategoryHelper(rawCategoryMapping, parentId, categoryCache),
  });
  // Memoize our work as we go.
  // eslint-disable-next-line no-param-reassign
  categoryCache[categoryId] = linkedCategory;
  return linkedCategory;
}

// Return the constituents of a given calculation.
function getConstituentIds(calculation) {
  const calculationType = calculation.type;
  if (calculationType !== 'FORMULA') {
    return [];
  }
  const { constituents } = calculation;
  return constituents.map(constituent => constituent.id);
}

// Return the datasource of a given field.
function getFieldMetadataSource(
  fieldPipelineDatasourceMappings: FieldPipelineDatasourceMapping,
): Dataset {
  let fieldMetadataSource = DUMMY_DATASOURCE;
  if (fieldPipelineDatasourceMappings.length > 0) {
    const { pipelineDatasource } = fieldPipelineDatasourceMappings[0];
    fieldMetadataSource = Dataset.create({
      id: relayIdToDatabaseId(pipelineDatasource.id),
      name: pipelineDatasource.name,
    });
  }
  return fieldMetadataSource;
}

// Override FieldMetadataService.buildCache with results obtained through our
// graphql query.
function buildFieldMetadataCache(
  resolve: ResolveFn<FieldMetadata>,
  reject: RejectFn,
): Promise<Cache<FieldMetadata>> {
  return Promise.resolve(fetchQuery(environment, FIELD_METADATA_QUERY, {}))
    .then((data: patchFieldMetadataServiceQueryResponse) => {
      const rawCategoryMapping = {};

      // Create a mapping from category id to category. This will be used to
      // create the linked categories for field metadata.
      data.categoryConnection.edges.forEach(({ node }) => {
        const { id, name, parent } = node;
        const categoryId = relayIdToDatabaseId(id);
        rawCategoryMapping[categoryId] = {
          id: categoryId,
          name,
          parent,
        };
      });

      // Create a mapping from field id to FieldMetadata.
      const fieldMetadataMappingCache = {};
      const linkedCategoryCache = {};
      data.fieldConnection.edges.forEach(({ node }) => {
        const {
          id,
          calculation,
          description,
          fieldDimensionMappings,
          fieldCategoryMappings,
          fieldPipelineDatasourceMappings,
        } = node;
        const fieldId = relayIdToDatabaseId(id);

        const fieldMetadataSource = getFieldMetadataSource(
          fieldPipelineDatasourceMappings,
        );
        const dimensions = fieldDimensionMappings.map(mapping => {
          const { dimension } = mapping;
          return Dimension.fromObject({
            id: relayIdToDatabaseId(dimension.id),
            name: dimension.name,
          });
        });

        // NOTE(yitian): For now, we are only considering the case where a
        // field can be associated with *one* category. The database allows more,
        // but we don't have a good use case for it yet.
        const { category } = fieldCategoryMappings[0];
        const linkedCategory = buildCategory(
          rawCategoryMapping,
          category,
          linkedCategoryCache,
        );
        const constituentIds = getConstituentIds(calculation);
        fieldMetadataMappingCache[fieldId] = FieldMetadata.create({
          id: fieldId,
          constituentIds,
          description:
            description !== undefined && description !== null
              ? description
              : '',
          dimensions,
          category: linkedCategory,
          source: fieldMetadataSource,
        });
      });
      resolve(fieldMetadataMappingCache);
      return fieldMetadataMappingCache;
    })
    .catch(reject);
}

// Patch the FieldMetadataService to use a GraphQL relay query instead of making a
// call to an AQT Flask-Potion endpoint.
export default function patchFieldMetadataService() {
  // $FlowExpectedError[cannot-write]
  FieldMetadataService.buildCache = buildFieldMetadataCache;
}
