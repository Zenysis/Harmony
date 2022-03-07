// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import EditableCategoryPath from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/CategoryRow/EditableCategoryPath';
import EditableItemControls from 'components/DataCatalogApp/common/EditableItemControls';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type { EditableCategoryValue_field$key } from './__generated__/EditableCategoryValue_field.graphql';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

type Props = {
  fragmentRef: EditableCategoryValue_field$key,
  hierarchyRoot: HierarchyItem<NamedItem>,
  onCategoriesChange: ($ReadOnlyMap<string, string>) => void,
};

type Category = {
  +id: string,
  +name: string,
};

function EditableCategoryValue({
  fragmentRef,
  hierarchyRoot,
  onCategoriesChange,
}: Props) {
  const { fieldCategoryMappings } = useFragment(
    graphql`
      fragment EditableCategoryValue_field on field {
        fieldCategoryMappings: field_category_mappings {
          category {
            id
            name
          }
        }
      }
    `,
    fragmentRef,
  );

  // Track the updated categories the user has selected. If the user modifies
  // a category, then we store a mapping from the original category id that was
  // selected to the new category.
  const [changedCategories, setChangedCategories] = React.useState<
    $ReadOnlyMap<string, Category>,
  >(new Map());
  React.useEffect(() => setChangedCategories(new Map()), [
    fieldCategoryMappings,
  ]);

  const [editing, setEditing] = React.useState(false);
  const onCancelClick = React.useCallback(() => {
    setEditing(false);
    setChangedCategories(new Map());
  }, []);

  const onSubmitClick = React.useCallback(() => {
    setEditing(false);
    if (changedCategories.size > 0) {
      const changedCategoryIds = new Map();
      Array.from(changedCategories).forEach(([originalId, { id }]) =>
        changedCategoryIds.set(originalId, id),
      );
      onCategoriesChange(changedCategoryIds);
    }
  }, [changedCategories, onCategoriesChange]);

  const renderPath = (category: Category) => {
    const currentCategory = changedCategories.get(category.id) || category;
    const onCategoryChange = (newCategoryId, newCategoryName) => {
      const updatedCategoryMap = new Map(changedCategories);
      if (newCategoryId === category.id) {
        updatedCategoryMap.delete(category.id);
      } else {
        const newCategory = { id: newCategoryId, name: newCategoryName };
        updatedCategoryMap.set(category.id, newCategory);
      }
      setChangedCategories(updatedCategoryMap);
    };

    return (
      <EditableCategoryPath
        buttonTitle={currentCategory.name}
        categoryId={currentCategory.id}
        editing={editing}
        hierarchyRoot={hierarchyRoot}
        key={`${category.id}-${currentCategory.id}`}
        onCategoryChange={onCategoryChange}
      />
    );
  };

  return (
    <div className="editable-category-value">
      <div className="editable-category-value__category-list">
        {fieldCategoryMappings.map(({ category }) => renderPath(category))}
      </div>
      <EditableItemControls
        editing={editing}
        onEditClick={() => setEditing(true)}
        onCancelClick={onCancelClick}
        onSubmitClick={onSubmitClick}
      />
    </div>
  );
}

export default (React.memo<Props>(
  EditableCategoryValue,
): React.AbstractComponent<Props>);
