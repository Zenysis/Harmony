// @flow
import * as React from 'react';
import { useMutation } from 'react-relay/hooks';

import BaseGroupModal from 'components/DataCatalogApp/common/GroupActionModals/BaseGroupModal';
import I18N from 'lib/I18N';
import Toaster from 'components/ui/Toaster';
import { createUniqueCategoryId } from 'components/DataCatalogApp/common/createUniqueCategoryId';
import { relayIdToDatabaseId } from 'util/graphql';

type Props = {
  categoryId: string,
  isModalOpen: boolean,
  onCloseModal: () => void,
};

export default function CreateGroupModal({
  categoryId,
  isModalOpen,
  onCloseModal,
}: Props): React.Element<typeof BaseGroupModal> {
  const [name, setName] = React.useState<string>('');

  const [commit] = useMutation(
    graphql`
      mutation CreateGroupModalMutation(
        $id: String!
        $name: String!
        $parentCategoryId: String!
      ) {
        insert_category(
          objects: { id: $id, name: $name, parent_id: $parentCategoryId }
        ) {
          returning
            @appendNode(
              connections: ["client:root:category_connection"]
              edgeTypeName: "categoryEdge"
            ) {
            id
            ...CategoryGroupRow_category
            ...ParentCategoryChange_category
          }
        }
      }
    `,
  );

  const onSaveName = React.useCallback(() => {
    commit({
      onCompleted: () => {
        Toaster.success(I18N.text('Create new group: %(name)s', { name }));
        analytics.track('Create new group in directory');
      },
      onError: error => Toaster.error(error.message),
      variables: {
        id: createUniqueCategoryId(),
        name,
        parentCategoryId: relayIdToDatabaseId(categoryId),
      },
    });
    onCloseModal();
  }, [commit, categoryId, name, onCloseModal]);

  return (
    <BaseGroupModal
      isOpen={isModalOpen}
      name={name}
      onClose={onCloseModal}
      onNameChange={setName}
      onSave={onSaveName}
      title={I18N.textById('createNewGroup')}
    />
  );
}
