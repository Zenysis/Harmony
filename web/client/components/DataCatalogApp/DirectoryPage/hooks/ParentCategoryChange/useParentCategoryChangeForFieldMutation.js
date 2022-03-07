// @flow
import * as React from 'react';
import { useMutation } from 'react-relay/hooks';
import type { UseMutationConfig } from 'react-relay/relay-experimental';

import removeOldFieldCategoryMappingLinks from 'components/DataCatalogApp/DirectoryPage/hooks/ParentCategoryChange/relayStoreUpdaters/removeOldFieldCategoryMappingLinks';
import { relayIdToDatabaseId } from 'util/graphql';
import type { useParentCategoryChangeForFieldMutation as MutationType } from './__generated__/useParentCategoryChangeForFieldMutation.graphql';

// NOTE(stephen): Defining input variables for the hook that are slightly
// different from the actual mutation's variables because we can save the user
// from having to convert relay IDs to database IDs.
type InputVariables = {
  fieldId: string,
  newParentCategoryId: string,
  originalParentCategoryId: string | void,
};

// Remove the existing field category mapping and replace it with a link to a
// new category. If there is no original parent category, create a new mapping
// for the provided field and category.
export default function useParentCategoryChangeForFieldMutation(): ({
  ...UseMutationConfig<MutationType>,
  variables: InputVariables,
}) => mixed {
  const [commit] = useMutation<MutationType>(
    graphql`
      mutation useParentCategoryChangeForFieldMutation(
        $dbFieldId: String!
        $dbNewParentCategoryId: String!
        $dbOriginalParentCategoryId: String
        $insertNewMapping: Boolean!
      ) {
        update_field_category_mapping(
          where: {
            _and: {
              field_id: { _eq: $dbFieldId }
              category_id: { _eq: $dbOriginalParentCategoryId }
            }
          }
          _set: { category_id: $dbNewParentCategoryId }
        ) @skip(if: $insertNewMapping) {
          returning {
            ...ParentCategoryChange_fieldCategoryMapping
          }
        }

        insert_field_category_mapping_one(
          object: { category_id: $dbNewParentCategoryId, field_id: $dbFieldId }
        ) @include(if: $insertNewMapping) {
          ...ParentCategoryChange_fieldCategoryMapping
        }
      }
    `,
  );

  const output = React.useCallback(
    ({ optimisticUpdater, updater, variables, ...passThroughParams }) => {
      const {
        fieldId,
        originalParentCategoryId,
        newParentCategoryId,
      } = variables;

      // Safety check to ensure we don't try to reassign a mapping to itself.
      if (originalParentCategoryId === newParentCategoryId) {
        return undefined;
      }

      const dbOriginalParentCategoryId =
        originalParentCategoryId !== undefined
          ? relayIdToDatabaseId(originalParentCategoryId)
          : undefined;

      const buildStoreUpdater = originalUpdater => {
        return (store, data) => {
          if (originalParentCategoryId) {
            removeOldFieldCategoryMappingLinks(
              store,
              originalParentCategoryId,
              [fieldId],
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
          dbFieldId: relayIdToDatabaseId(fieldId),
          dbNewParentCategoryId: relayIdToDatabaseId(newParentCategoryId),
          insertNewMapping: dbOriginalParentCategoryId === undefined,
          dbOriginalParentCategoryId,
        },
      });
    },
    [commit],
  );

  return output;
}
