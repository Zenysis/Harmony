// @flow
import * as React from 'react';
import { useMutation } from 'react-relay/hooks';
import type { UseMutationConfig } from 'react-relay/relay-experimental';

import removeOldCategoryChildren from 'components/DataCatalogApp/DirectoryPage/hooks/ParentCategoryChange/relayStoreUpdaters/removeOldCategoryChildren';
import { relayIdToDatabaseId } from 'util/graphql';
import type { useParentCategoryChangeForCategoryMutation as MutationType } from './__generated__/useParentCategoryChangeForCategoryMutation.graphql';

// NOTE(stephen): Defining input variables for the hook that are slightly
// different from the actual mutation's variables because we can save the user
// from having to convert relay IDs to database IDs.
type InputVariables = {
  categoryId: string,
  newParentCategoryId: string,
  originalParentCategoryId: string | void,
};

// Remove the existing category to category mapping and replace it with a link
// to a new category. If there is no original parent category, create a new
// mapping for the provided categories.
export default function useParentCategoryChangeForCategoryMutation(): ({
  ...UseMutationConfig<MutationType>,
  variables: InputVariables,
}) => mixed {
  const [commit] = useMutation<MutationType>(
    graphql`
      mutation useParentCategoryChangeForCategoryMutation(
        $dbCategoryId: String!
        $dbNewParentCategoryId: String!
      ) {
        update_category(
          where: { id: { _eq: $dbCategoryId } }
          _set: { parent_id: $dbNewParentCategoryId }
        ) {
          returning {
            ...ParentCategoryChange_category
          }
        }
      }
    `,
  );

  const output = React.useCallback(
    ({ optimisticUpdater, updater, variables, ...passThroughParams }) => {
      const {
        categoryId,
        originalParentCategoryId,
        newParentCategoryId,
      } = variables;

      // Safety check to ensure we don't try to reassign a mapping to itself.
      if (originalParentCategoryId === newParentCategoryId) {
        return undefined;
      }

      const buildStoreUpdater = originalUpdater => {
        return (store, data) => {
          if (originalParentCategoryId !== undefined) {
            removeOldCategoryChildren(store, originalParentCategoryId, [
              categoryId,
            ]);
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
          dbCategoryId: relayIdToDatabaseId(categoryId),
          dbNewParentCategoryId: relayIdToDatabaseId(newParentCategoryId),
        },
      });
    },
    [commit],
  );

  return output;
}
