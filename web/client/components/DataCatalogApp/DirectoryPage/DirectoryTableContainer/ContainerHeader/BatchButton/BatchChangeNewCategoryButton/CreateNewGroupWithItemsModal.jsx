// @flow
import * as React from 'react';

import BaseGroupModal from 'components/DataCatalogApp/common/GroupActionModals/BaseGroupModal';
import I18N from 'lib/I18N';
import Toaster from 'components/ui/Toaster';
import useBatchParentCategoryChangeMutation from 'components/DataCatalogApp/DirectoryPage/hooks/ParentCategoryChange/useBatchParentCategoryChangeMutation';
import { createUniqueCategoryId } from 'components/DataCatalogApp/common/createUniqueCategoryId';
import { databaseIdToRelayId } from 'util/graphql';

type Props = {
  categoryId: string,
  isOpen: boolean,
  onClose: () => void,
  selectedCategoryIds: $ReadOnlySet<string>,
  selectedFieldIds: $ReadOnlySet<string>,
};

export default function CreateNewGroupWithItemsModal({
  categoryId,
  isOpen,
  onClose,
  selectedCategoryIds,
  selectedFieldIds,
}: Props): React.Element<typeof BaseGroupModal> {
  const [name, setName] = React.useState<string>('');
  const commit = useBatchParentCategoryChangeMutation();

  const onSave = React.useCallback(() => {
    const dbNewCategoryId = createUniqueCategoryId();

    commit({
      onCompleted: () => {
        Toaster.success(
          I18N.text('Items have been moved to new group: %(groupName)s', {
            groupName: name,
          }),
        );
        analytics.track('Create new group with multi-select items ');
      },
      onError: error => Toaster.error(error.message),
      variables: {
        categoryIds: Array.from(selectedCategoryIds),
        createNewParentCategoryWithName: name,
        fieldIds: Array.from(selectedFieldIds),

        // NOTE(stephen): Need to convert the database-style category ID that
        // we generate into a relay-style ID so that we can reuse the existing
        // batch category change mutation logic.
        newParentCategoryId: databaseIdToRelayId(dbNewCategoryId, 'category'),
        originalParentCategoryId: categoryId,
      },
    });
    onClose();
  }, [
    categoryId,
    commit,
    name,
    onClose,
    selectedCategoryIds,
    selectedFieldIds,
  ]);

  return (
    <BaseGroupModal
      isOpen={isOpen}
      name={name}
      onClose={onClose}
      onNameChange={setName}
      onSave={onSave}
      title={I18N.text('Create new group with items')}
    />
  );
}
