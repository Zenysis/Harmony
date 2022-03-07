// @flow
import * as React from 'react';
import { useMutation } from 'react-relay/hooks';

import DeleteItemModal from 'components/DataCatalogApp/common/DeleteItemModal';
import I18N from 'lib/I18N';
import Toaster from 'components/ui/Toaster';
import removeOldFieldCategoryMappingLinks from 'components/DataCatalogApp/DirectoryPage/hooks/ParentCategoryChange/relayStoreUpdaters/removeOldFieldCategoryMappingLinks';
import { relayIdToDatabaseId } from 'util/graphql';
import type { DeleteFieldModalMutation } from './__generated__/DeleteFieldModalMutation.graphql';

type Props = {
  id: string,
  name: string,
  onRequestClose: () => void,
  show: boolean,

  onFieldDeleted?: (() => void) | void,
  parentCategoryId?: string,
};

export default function DeleteFieldModal({
  id,
  name,
  onRequestClose,
  show,

  onFieldDeleted = undefined,
  parentCategoryId = undefined,
}: Props): React.Node {
  const [commitDeleteField] = useMutation<DeleteFieldModalMutation>(
    graphql`
      mutation DeleteFieldModalMutation($dbFieldId: String!) {
        delete_field_by_pk(id: $dbFieldId) {
          id
          fieldCategoryMapping: field_category_mappings {
            ...ParentCategoryChange_fieldCategoryMapping
          }
        }
      }
    `,
  );

  const storeUpdater = React.useCallback(
    store => {
      if (parentCategoryId) {
        removeOldFieldCategoryMappingLinks(store, parentCategoryId, [id]);
      }
    },
    [id, parentCategoryId],
  );

  const onDeleteFieldClick = React.useCallback(() => {
    commitDeleteField({
      onCompleted: () => {
        Toaster.success(
          I18N.text('Indicator "%(name)s" has been deleted successfully', {
            name,
          }),
        );
        if (onFieldDeleted !== undefined) {
          onFieldDeleted();
        }
      },
      onError: error => Toaster.error(error.message),
      optimisticUpdater: storeUpdater,
      updater: storeUpdater,
      variables: {
        dbFieldId: relayIdToDatabaseId(id),
      },
    });
    onRequestClose();
  }, [commitDeleteField, id, onFieldDeleted, onRequestClose, name]);

  return (
    <DeleteItemModal
      promptText={I18N.text(
        'You cannot recover "%(name)s" indicator once deleted.',
        'deleteField',
        { name },
      )}
      show={show}
      onDeleteItemClick={onDeleteFieldClick}
      onRequestClose={onRequestClose}
      title={I18N.text('Delete Indicator?')}
    />
  );
}
