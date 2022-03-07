// @flow
import * as React from 'react';
import { useMutation } from 'react-relay/hooks';
import type { UseMutationConfig } from 'react-relay/relay-experimental';

import removeOldCategoryChildren from 'components/DataCatalogApp/DirectoryPage/hooks/ParentCategoryChange/relayStoreUpdaters/removeOldCategoryChildren';
import removeOldFieldCategoryMappingLinks from 'components/DataCatalogApp/DirectoryPage/hooks/ParentCategoryChange/relayStoreUpdaters/removeOldFieldCategoryMappingLinks';
import { relayIdToDatabaseId } from 'util/graphql';
import type { useBatchParentCategoryChangeMutation as MutationType } from './__generated__/useBatchParentCategoryChangeMutation.graphql';

// NOTE(stephen): Defining input variables for the hook that are slightly
// different from the actual mutation's variables because we can save the user
// from having to convert relay IDs to database IDs.
type InputVariables = {
  categoryIds: $ReadOnlyArray<string>,
  fieldIds: $ReadOnlyArray<string>,
  newParentCategoryId: string,
  originalParentCategoryId: string | void,

  // HACK(stephen): I couldn't figure out a clean way to share the core batch
  // change mutation body with a different mutation that also could create a new
  // category. So instead I shoe-horned in a way to do it here, since creating
  // a new category was not as common of an operation.
  createNewParentCategoryWithName?: string,
};

export default function useBatchParentCategoryChangeMutation(): ({
  ...UseMutationConfig<MutationType>,
  variables: InputVariables,
}) => mixed {
  const [commit] = useMutation<MutationType>(
    graphql`
      mutation useBatchParentCategoryChangeMutation(
        $dbCategoryIds: [String!]!
        $dbFieldIds: [String!]!
        $dbNewParentCategoryId: String!
        $dbOriginalParentCategoryId: String
        $insertNewCategory: Boolean!
        $insertNewMapping: Boolean!
        $newFieldMappingObjects: [field_category_mapping_insert_input!]!
        $newParentCategoryName: String
      ) {
        insert_category(
          objects: [
            {
              id: $dbNewParentCategoryId
              name: $newParentCategoryName
              parent_id: $dbOriginalParentCategoryId
            }
          ]
        ) @include(if: $insertNewCategory) {
          returning
            @appendNode(
              connections: ["client:root:category_connection"]
              edgeTypeName: "categoryEdge"
            ) {
            id
            name
            parent {
              id
            }
            ...ParentCategoryChange_category
          }
        }

        update_category(
          where: { id: { _in: $dbCategoryIds } }
          _set: { parent_id: $dbNewParentCategoryId }
        ) {
          returning {
            ...ParentCategoryChange_category
          }
        }

        update_field_category_mapping(
          where: {
            _and: {
              field_id: { _in: $dbFieldIds }
              category_id: { _eq: $dbOriginalParentCategoryId }
            }
          }
          _set: { category_id: $dbNewParentCategoryId }
        ) @skip(if: $insertNewMapping) {
          returning {
            ...ParentCategoryChange_fieldCategoryMapping
          }
        }

        insert_field_category_mapping(objects: $newFieldMappingObjects)
          @include(if: $insertNewMapping) {
          returning {
            ...ParentCategoryChange_fieldCategoryMapping
          }
        }
      }
    `,
  );

  const output = React.useCallback(
    ({ optimisticUpdater, updater, variables, ...passThroughParams }) => {
      const {
        categoryIds,
        createNewParentCategoryWithName,
        fieldIds,
        newParentCategoryId,
        originalParentCategoryId,
      } = variables;

      // Safety check to ensure we don't try to reassign a mapping to itself.
      if (originalParentCategoryId === newParentCategoryId) {
        return undefined;
      }

      const dbOriginalParentCategoryId =
        originalParentCategoryId !== undefined
          ? relayIdToDatabaseId(originalParentCategoryId)
          : undefined;

      const dbCategoryIds = categoryIds.map(relayIdToDatabaseId);
      const dbFieldIds = fieldIds.map(relayIdToDatabaseId);
      const dbNewParentCategoryId = relayIdToDatabaseId(newParentCategoryId);

      // TODO(yitian): Investigate using @deleteEdge so that we don't need to
      // manually modify the store.
      const buildStoreUpdater = originalUpdater => {
        return (store, data) => {
          if (originalParentCategoryId) {
            removeOldCategoryChildren(
              store,
              originalParentCategoryId,
              categoryIds,
            );
            removeOldFieldCategoryMappingLinks(
              store,
              originalParentCategoryId,
              fieldIds,
            );
          }

          if (originalUpdater) {
            originalUpdater(store, data);
          }
        };
      };

      return commit({
        ...passThroughParams,
        optimisticUpdater: buildStoreUpdater(optimisticUpdater),
        updater: buildStoreUpdater(updater),
        variables: {
          dbCategoryIds,
          dbFieldIds,
          dbNewParentCategoryId,
          dbOriginalParentCategoryId,
          insertNewCategory: createNewParentCategoryWithName !== undefined,
          insertNewMapping: dbOriginalParentCategoryId === undefined,
          newFieldMappingObjects: dbFieldIds.map(id => ({
            category_id: dbNewParentCategoryId,
            field_id: id,
          })),
          newParentCategoryName: createNewParentCategoryWithName,
        },
      });
    },
    [commit],
  );

  return output;
}
