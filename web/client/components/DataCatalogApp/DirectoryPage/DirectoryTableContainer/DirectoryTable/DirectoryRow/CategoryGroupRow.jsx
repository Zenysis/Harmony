// @flow
import * as React from 'react';
import { useFragment, useMutation } from 'react-relay/hooks';

import DeleteCategoryModal from 'components/DataCatalogApp/common/GroupActionModals/DeleteCategoryModal';
import DirectoryRow from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer/DirectoryTable/DirectoryRow';
import I18N from 'lib/I18N';
import useBoolean from 'lib/hooks/useBoolean';
import useCategoryContentCount from 'components/DataCatalogApp/common/hooks/useCategoryContentCount';
import useParentCategoryChangeForCategoryMutation from 'components/DataCatalogApp/DirectoryPage/hooks/ParentCategoryChange/useParentCategoryChangeForCategoryMutation';
import { relayIdToDatabaseId } from 'util/graphql';
import type { CategoryGroupRowValueMutation } from './__generated__/CategoryGroupRowValueMutation.graphql';
import type { CategoryGroupRow_category$key } from './__generated__/CategoryGroupRow_category.graphql';

type Props = {
  categoryFragmentRef: CategoryGroupRow_category$key,
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof DirectoryRow>,
    'hierarchyRoot',
  >,
  onClick: (id: string) => void,
  onSelect: (id: string) => void,
  parentCategoryId: string,
  selected: boolean,
};

function CategoryGroupRow({
  categoryFragmentRef,
  hierarchyRoot,
  onClick,
  onSelect,
  parentCategoryId,
  selected,
}: Props) {
  const data = useFragment(
    graphql`
      fragment CategoryGroupRow_category on category {
        id
        name
        visibilityStatus: visibility_status
        ...useCategoryContentCount_category
      }
    `,
    categoryFragmentRef,
  );

  const { id, name, visibilityStatus } = data;

  const [
    deleteCategoryModalOpen,
    onOpenDeleteCategoryModal,
    onCloseDeleteCategoryModal,
  ] = useBoolean(false);

  const commitParentCategoryChange = useParentCategoryChangeForCategoryMutation();

  const categoryContentCount = useCategoryContentCount(data);

  const isGroupEmpty = categoryContentCount <= 0;

  const [
    commitCategoryValueChange,
  ] = useMutation<CategoryGroupRowValueMutation>(
    graphql`
      mutation CategoryGroupRowValueMutation(
        $dbId: String!
        $newName: String!
        $newVisibilityStatus: visibility_status_enum!
      ) {
        update_category_by_pk(
          pk_columns: { id: $dbId }
          _set: { name: $newName, visibility_status: $newVisibilityStatus }
        ) {
          id
          name
          visibilityStatus: visibility_status
        }
      }
    `,
  );

  const onCategoryChange = React.useCallback(
    (newParentCategoryId, onCompleted, onError) => {
      // Safety check to ensure we don't try to reassign a mapping to itself and
      // to avoid self-referential changes (which likely would fail).
      if (
        parentCategoryId === newParentCategoryId ||
        id === newParentCategoryId
      ) {
        return;
      }

      commitParentCategoryChange({
        onCompleted,
        onError,
        variables: {
          categoryId: id,
          originalParentCategoryId: parentCategoryId,
          newParentCategoryId,
        },
      });
      analytics.track('Move item in directory', {
        type: 'group',
        location: 'row',
        multiselect: false,
      });
    },
    [commitParentCategoryChange, id, parentCategoryId],
  );

  const onValueChange = React.useCallback(
    newValue => {
      commitCategoryValueChange({
        variables: {
          dbId: relayIdToDatabaseId(id),
          newName: newValue.name,
          newVisibilityStatus: newValue.visibilityStatus,
        },
      });
      analytics.track('Edit category row in directory table');
    },
    [commitCategoryValueChange, id],
  );

  const onRowClick = React.useCallback(() => {
    analytics.track('Click on directory table group');
    onClick(id);
  }, [id, onClick]);
  const onRowSelect = React.useCallback(() => onSelect(id), [id, onSelect]);

  const deleteOptionTooltip = !isGroupEmpty
    ? I18N.text('Group must be empty to be deleted')
    : undefined;

  const onDeleteClick = isGroupEmpty ? onOpenDeleteCategoryModal : undefined;
  const onCategoryDelete = () =>
    analytics.track('Delete group', { location: 'row' });

  return (
    <>
      <DirectoryRow
        deleteOptionTooltip={deleteOptionTooltip}
        hierarchyRoot={hierarchyRoot}
        id={id}
        name={name}
        onCategoryChange={onCategoryChange}
        onClick={onRowClick}
        onSelect={onRowSelect}
        onDeleteClick={onDeleteClick}
        onValueChange={onValueChange}
        selected={selected}
        type="category"
        visibilityStatus={visibilityStatus}
      />
      <DeleteCategoryModal
        show={deleteCategoryModalOpen}
        id={id}
        onRequestClose={onCloseDeleteCategoryModal}
        name={name}
        onCategoryDelete={onCategoryDelete}
      />
    </>
  );
}

export default (React.memo(CategoryGroupRow): React.AbstractComponent<Props>);
