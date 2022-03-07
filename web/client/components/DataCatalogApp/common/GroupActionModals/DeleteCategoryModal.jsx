// @flow
import * as React from 'react';
import { useMutation } from 'react-relay/hooks';

import DeleteItemModal from 'components/DataCatalogApp/common/DeleteItemModal';
import I18N from 'lib/I18N';
import Toaster from 'components/ui/Toaster';
import { relayIdToDatabaseId } from 'util/graphql';
import type { DeleteCategoryModalMutation } from './__generated__/DeleteCategoryModalMutation.graphql';

type Props = {
  id: string,
  name: string,
  onRequestClose: () => void,
  show: boolean,

  onCategoryDelete?: (() => void) | void,
};

export default function DeleteCategoryModal({
  id,
  name,
  onRequestClose,
  show,

  onCategoryDelete = undefined,
}: Props): React.Node {
  const [commitDeleteCategory] = useMutation<DeleteCategoryModalMutation>(
    graphql`
      mutation DeleteCategoryModalMutation($dbCategoryId: String!) {
        delete_category_by_pk(id: $dbCategoryId) {
          id @deleteEdge(connections: ["client:root:category_connection"])
          ...ParentCategoryChange_category
        }
      }
    `,
  );

  const onDeleteCategoryButtonClick = React.useCallback(() => {
    commitDeleteCategory({
      onCompleted: () => {
        Toaster.success(
          I18N.text('Group "%(name)s" has been deleted successfully', {
            name,
          }),
        );
        if (onCategoryDelete !== undefined) {
          onCategoryDelete();
        }
      },
      onError: error => Toaster.error(error.message),
      variables: {
        dbCategoryId: relayIdToDatabaseId(id),
      },
    });
    onRequestClose();
  }, [commitDeleteCategory, id, onCategoryDelete, onRequestClose, name]);

  return (
    <DeleteItemModal
      promptText={I18N.text(
        'You cannot recover "%(name)s" group once deleted.',
        'deletionPrompt',
        {
          name,
        },
      )}
      show={show}
      onDeleteItemClick={onDeleteCategoryButtonClick}
      onRequestClose={onRequestClose}
      title={I18N.text('Delete Group?')}
    />
  );
}
