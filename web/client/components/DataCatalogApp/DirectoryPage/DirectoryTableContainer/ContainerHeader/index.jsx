// @flow
import * as React from 'react';
import classNames from 'classnames';

import ActionButton from 'components/DataCatalogApp/common/ActionButton';
import BatchChangeCategoryButton from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer/ContainerHeader/BatchButton/BatchChangeCategoryButton';
import BatchChangeNewCategoryButton from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer/ContainerHeader/BatchButton/BatchChangeNewCategoryButton';
import CreateCalculationIndicatorView from 'components/DataCatalogApp/common/CreateCalculationIndicatorView';
import CreateGroupModal from 'components/DataCatalogApp/common/GroupActionModals/CreateGroupModal';
import FallbackPill from 'components/DataCatalogApp/common/FallbackPill';
import I18N from 'lib/I18N';
import useBoolean from 'lib/hooks/useBoolean';

type Props = {
  categoryId: string,
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof CreateCalculationIndicatorView>,
    'hierarchyRoot',
  > | void,
  itemCount: number,
  selectedCategories: $ReadOnlySet<string>,
  selectedFields: $ReadOnlySet<string>,
};

export default function ContainerHeader({
  categoryId,
  hierarchyRoot,
  itemCount,
  selectedCategories,
  selectedFields,
}: Props): React.Element<'div'> {
  const disabled = hierarchyRoot === undefined;

  const [
    showCreateGroupModal,
    openCreateGroupModal,
    closeCreateGroupModal,
  ] = useBoolean(false);
  const [
    showCreateIndicatorModal,
    openCreateIndicatorModal,
    closeCreateIndicatorModal,
  ] = useBoolean(false);

  const selectedItemCount = selectedCategories.size + selectedFields.size;
  const hasBatchSelection = selectedItemCount > 0;

  function maybeRenderBatchButtons() {
    if (!hasBatchSelection || hierarchyRoot === undefined) {
      return null;
    }

    return (
      <div className="dc-directory-table-container-header__batch-buttons">
        <BatchChangeCategoryButton
          categoryId={categoryId}
          hierarchyRoot={hierarchyRoot}
          selectedCategoryIds={selectedCategories}
          selectedFieldIds={selectedFields}
        />
        <BatchChangeNewCategoryButton
          categoryId={categoryId}
          selectedCategoryIds={selectedCategories}
          selectedFieldIds={selectedFields}
        />
      </div>
    );
  }

  function maybeRenderActionButtons() {
    if (hasBatchSelection) {
      return null;
    }

    return (
      <div className="dc-directory-table-container-header__action-buttons">
        <ActionButton
          disabled={disabled}
          iconType="svg-create-new-folder"
          label={I18N.text('Create new group', 'createNewGroup')}
          onClick={openCreateGroupModal}
        />
        <ActionButton
          disabled={disabled}
          iconType="pencil"
          label={I18N.text('Define new indicator')}
          onClick={openCreateIndicatorModal}
        />
      </div>
    );
  }

  function renderLabelContent() {
    if (disabled) {
      return <FallbackPill height={14} width={50} />;
    }

    return hasBatchSelection
      ? I18N.text('%(selectedItemCount)s selected', { selectedItemCount })
      : I18N.text('%(itemCount)s results', { itemCount });
  }

  const labelClassName = classNames(
    'dc-directory-table-container-header__label',
    { 'dc-directory-table-container-header__label--batch': hasBatchSelection },
  );
  return (
    <div className="dc-directory-table-container-header">
      <div className={labelClassName}>{renderLabelContent()}</div>
      {maybeRenderActionButtons()}
      {maybeRenderBatchButtons()}
      {showCreateGroupModal && (
        <CreateGroupModal
          categoryId={categoryId}
          isModalOpen={showCreateGroupModal}
          onCloseModal={closeCreateGroupModal}
        />
      )}
      {showCreateIndicatorModal && hierarchyRoot && (
        <CreateCalculationIndicatorView
          categoryId={categoryId}
          hierarchyRoot={hierarchyRoot}
          onCloseView={closeCreateIndicatorModal}
        />
      )}
    </div>
  );
}
