// @flow
import * as React from 'react';

import BatchButton from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer/ContainerHeader/BatchButton';
import CreateNewGroupWithItemsModal from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer/ContainerHeader/BatchButton/BatchChangeNewCategoryButton/CreateNewGroupWithItemsModal';
import I18N from 'lib/I18N';
import useBoolean from 'lib/hooks/useBoolean';

type Props = {
  categoryId: string,
  selectedCategoryIds: $ReadOnlySet<string>,
  selectedFieldIds: $ReadOnlySet<string>,
};

export default function BatchChangeNewCategoryButton({
  categoryId,
  selectedCategoryIds,
  selectedFieldIds,
}: Props): React.Element<typeof React.Fragment> {
  const [isPopoverOpen, openPopover, closePopover] = useBoolean(false);

  return (
    <React.Fragment>
      <BatchButton
        iconType="svg-create-new-folder"
        onClick={openPopover}
        text={I18N.text('New group with items')}
      />
      <CreateNewGroupWithItemsModal
        categoryId={categoryId}
        isOpen={isPopoverOpen}
        onClose={closePopover}
        selectedCategoryIds={selectedCategoryIds}
        selectedFieldIds={selectedFieldIds}
      />
    </React.Fragment>
  );
}
