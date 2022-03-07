// @flow
import * as React from 'react';
import { useMutation } from 'react-relay/hooks';

import BaseGroupModal from 'components/DataCatalogApp/common/GroupActionModals/BaseGroupModal';
import I18N from 'lib/I18N';
import Toaster from 'components/ui/Toaster';
import { relayIdToDatabaseId } from 'util/graphql';

type Props = {
  categoryId: string,
  categoryName: string,
  isModalOpen: boolean,
  onCloseModal: () => void,
};

const TEXT = {
  title: 'Rename group',
};

export default function EditGroupModal({
  categoryId,
  categoryName,
  isModalOpen,
  onCloseModal,
}: Props): React.Element<typeof BaseGroupModal> {
  const [name, setName] = React.useState<string>(categoryName);

  // If the category name is changed somewhere else (either because the user
  // navigated to a new category or because the name was changed elsewhere), we
  // need to reset the state.
  React.useEffect(() => {
    setName(categoryName);
  }, [categoryName]);

  const [commit] = useMutation(
    graphql`
      mutation EditGroupModalMutation(
        $dbCategoryId: String!
        $newCategoryName: String!
      ) {
        update_category_by_pk(
          pk_columns: { id: $dbCategoryId }
          _set: { name: $newCategoryName }
        ) {
          id
          name
        }
      }
    `,
  );

  const onSaveName = React.useCallback(() => {
    commit({
      variables: {
        dbCategoryId: relayIdToDatabaseId(categoryId),
        newCategoryName: name,
      },
      onCompleted: () =>
        Toaster.success(
          I18N.text('Group %(name1)s is now called %(name2)s', {
            name1: categoryName,
            name2: name,
          }),
        ),
      onError: error => Toaster.error(error.message),
    });
    onCloseModal();
  }, [categoryId, categoryName, commit, name, onCloseModal]);

  return (
    <BaseGroupModal
      isOpen={isModalOpen}
      name={name}
      onClose={onCloseModal}
      onNameChange={setName}
      onSave={onSaveName}
      title={TEXT.title}
    />
  );
}
