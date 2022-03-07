// @flow
import * as React from 'react';

import HierarchicalSelectorWrapper from 'components/DataCatalogApp/common/HierarchicalSelectorWrapper';

type Props = {
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof HierarchicalSelectorWrapper>,
    'hierarchyRoot',
  >,
  id: string,
  onCategoryChange: (id: string, name: string) => void,

  allowCategoryReselection?: boolean,
  allowRootSelection?: boolean,
  applyButtonText?: string,
};

export default function ChangeCategorySelector({
  hierarchyRoot,
  id,
  onCategoryChange,
  allowCategoryReselection = false,
  allowRootSelection = true,
  applyButtonText = undefined,
}: Props): React.Element<typeof HierarchicalSelectorWrapper> {
  const [selectedItem, setSelectedItem] = React.useState(hierarchyRoot);

  const onApplyButtonClick = React.useCallback(() => {
    const newCategoryId = selectedItem.id();
    if (id !== newCategoryId) {
      onCategoryChange(
        newCategoryId,
        selectedItem.metadata() !== undefined
          ? selectedItem.metadata().name()
          : '',
      );
    }
  }, [id, onCategoryChange, selectedItem]);

  // Only allow categories to be selected inside the CategoryFilter. If the
  // current row is a category, disable selecting the same category in the
  // hierarchical selector (unless specified otherwise). This is to prevent a
  // category being moved to a child category.
  const testItemSelectable = React.useCallback(
    item =>
      item.isCategoryItem() && (item.id() !== id || allowCategoryReselection),
    [allowCategoryReselection, id],
  );

  return (
    <HierarchicalSelectorWrapper
      applyButtonText={applyButtonText}
      disableApplyButton={!allowRootSelection && selectedItem === hierarchyRoot}
      hierarchyRoot={hierarchyRoot}
      onApplyButtonClick={onApplyButtonClick}
      onHierarchyPathTailChange={setSelectedItem}
      testItemSelectable={testItemSelectable}
    />
  );
}
