// @flow
import * as React from 'react';

import BreadcrumbChangeCategoryOption from 'components/DataCatalogApp/DirectoryPage/BreadcrumbPath/BreadcrumbChangeCategoryOption';
import CreateGroupModal from 'components/DataCatalogApp/common/GroupActionModals/CreateGroupModal';
import DeleteCategoryModal from 'components/DataCatalogApp/common/GroupActionModals/DeleteCategoryModal';
import Dropdown from 'components/ui/Dropdown';
import EditGroupModal from 'components/DataCatalogApp/common/GroupActionModals/EditGroupModal';
import I18N from 'lib/I18N';
import Popover from 'components/ui/Popover';
import useBoolean from 'lib/hooks/useBoolean';

type Props = {
  allowDeletion: boolean,
  categoryId: string,
  categoryName: string,
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof BreadcrumbChangeCategoryOption>,
    'hierarchyRoot',
  >,
  onCurrentCategoryChange: string => void,
  onMenuClose: () => void,
  onMenuOpen: () => void,
  parentCategoryId: string | void,
};

// Directory table breadcrumb leaf item menu.
export default function BreadcrumbMenu({
  categoryId,
  categoryName,
  hierarchyRoot,
  onCurrentCategoryChange,
  onMenuClose,
  onMenuOpen,
  parentCategoryId,
  allowDeletion = false,
}: Props): React.Element<'div'> {
  const [
    showCreateGroupModal,
    openCreateGroupModal,
    closeCreateGroupModal,
  ] = useBoolean(false);
  const [
    showEditGroupModal,
    openEditGroupModal,
    closeEditGroupModal,
  ] = useBoolean(false);
  const [
    showDeleteGroupModal,
    openDeleteGroupModal,
    closeDeleteGroupModal,
  ] = useBoolean(false);
  const [showSelector, openSelector, closeSelector] = useBoolean(false);
  const dropdownRef = React.useRef();

  const onMenuItemClick = React.useCallback(
    (value: string) => {
      if (value === 'rename') {
        openEditGroupModal();
      } else if (value === 'create') {
        openCreateGroupModal();
      } else if (value === 'move') {
        openSelector();
      } else if (value === 'delete') {
        openDeleteGroupModal();
      }
    },
    [
      openCreateGroupModal,
      openDeleteGroupModal,
      openEditGroupModal,
      openSelector,
    ],
  );

  const onCategoryDelete = React.useCallback(() => {
    // When a category is deleted, navigate the app to point at the parent
    // category.
    // NOTE(stephen): Given the way we structure the category tree, it should
    // not be possible for parentCategoryId to be undefined. But it is
    // technically possible in the DB schema, so we'll be safe and check for
    // this case.
    if (parentCategoryId !== undefined) {
      onCurrentCategoryChange(parentCategoryId);
    }
    analytics.track('Delete group', { location: 'breadcrumb' });
  }, [onCurrentCategoryChange, parentCategoryId]);

  // The root category can never be renamed, moved, or deleted.
  const isRoot = hierarchyRoot.id() === categoryId;
  return (
    <div className="dc-breadcrumb-menu" ref={dropdownRef}>
      <Dropdown
        buttonClassName="dc-breadcrumb-menu__dropdown-button-wrapper"
        defaultDisplayContent={null}
        hideCaret={false}
        onDropdownClose={onMenuClose}
        onOpenDropdownClick={onMenuOpen}
        onSelectionChange={onMenuItemClick}
        value={undefined}
      >
        <Dropdown.Option unselectable={isRoot} value="rename">
          <I18N>Rename group</I18N>
        </Dropdown.Option>
        <Dropdown.Option value="create">
          <I18N>Create new group</I18N>
        </Dropdown.Option>
        <Dropdown.Option unselectable={isRoot} value="move">
          <I18N>Move group to</I18N>
        </Dropdown.Option>
        <Dropdown.Option unselectable={isRoot || !allowDeletion} value="delete">
          <I18N>Delete group</I18N>
        </Dropdown.Option>
      </Dropdown>
      <CreateGroupModal
        categoryId={categoryId}
        isModalOpen={showCreateGroupModal}
        onCloseModal={closeCreateGroupModal}
      />
      <EditGroupModal
        categoryId={categoryId}
        categoryName={categoryName}
        isModalOpen={showEditGroupModal}
        onCloseModal={closeEditGroupModal}
      />
      <DeleteCategoryModal
        id={categoryId}
        name={categoryName}
        onCategoryDelete={onCategoryDelete}
        onRequestClose={closeDeleteGroupModal}
        show={showDeleteGroupModal}
      />
      {parentCategoryId !== undefined && (
        <Popover
          anchorElt={dropdownRef.current}
          anchorOrigin={Popover.Origins.BOTTOM_LEFT}
          containerType={Popover.Containers.NONE}
          doNotFlip
          isOpen={showSelector}
          keepInWindow
          onRequestClose={closeSelector}
          popoverOrigin={Popover.Origins.TOP_LEFT}
        >
          <BreadcrumbChangeCategoryOption
            categoryId={categoryId}
            categoryName={categoryName}
            hierarchyRoot={hierarchyRoot}
            onSelectorClose={closeSelector}
            parentCategoryId={parentCategoryId}
          />
        </Popover>
      )}
    </div>
  );
}
