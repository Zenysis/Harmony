// @flow
import * as React from 'react';

import BatchButton from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer/ContainerHeader/BatchButton';
import HierarchicalSelectorWrapper from 'components/DataCatalogApp/common/HierarchicalSelectorWrapper';
import I18N from 'lib/I18N';
import Popover from 'components/ui/Popover';
import Toaster from 'components/ui/Toaster';
import useBatchParentCategoryChangeMutation from 'components/DataCatalogApp/DirectoryPage/hooks/ParentCategoryChange/useBatchParentCategoryChangeMutation';
import useBoolean from 'lib/hooks/useBoolean';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

type Props = {
  categoryId: string,
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof HierarchicalSelectorWrapper>,
    'hierarchyRoot',
  >,
  selectedCategoryIds: $ReadOnlySet<string>,
  selectedFieldIds: $ReadOnlySet<string>,
};

export default function BatchChangeCategoryButton({
  categoryId,
  hierarchyRoot,
  selectedCategoryIds,
  selectedFieldIds,
}: Props): React.Element<typeof React.Fragment> {
  const [selectedItem, setSelectedItem] = React.useState(hierarchyRoot);
  const [isSelectorOpen, openSelector, closeSelector] = useBoolean(false);
  const selectorRef = React.useRef(null);
  const commit = useBatchParentCategoryChangeMutation();

  const onApplyButtonClick = React.useCallback(() => {
    commit({
      onCompleted: () => {
        Toaster.success(
          I18N.text('Items have been moved to %(newCategoryName)s', {
            newCategoryName: selectedItem.metadata().name(),
          }),
        );
        analytics.track('Move item in directory', {
          type: 'indicator',
          location: 'row',
          multiselect: true,
        });
      },
      onError: error => Toaster.error(error.message),
      variables: {
        categoryIds: Array.from(selectedCategoryIds),
        fieldIds: Array.from(selectedFieldIds),
        newParentCategoryId: selectedItem.id(),
        originalParentCategoryId: categoryId,
      },
    });

    closeSelector();
  }, [
    categoryId,
    closeSelector,
    commit,
    selectedCategoryIds,
    selectedFieldIds,
    selectedItem,
  ]);

  const testItemSelectable = React.useCallback(
    (item: HierarchyItem<NamedItem>) =>
      item.isCategoryItem() && !selectedCategoryIds.has(item.id()),
    [selectedCategoryIds],
  );

  return (
    <React.Fragment>
      <BatchButton
        buttonRef={selectorRef}
        iconType="svg-move"
        onClick={openSelector}
        text={I18N.textById('Move to')}
      />
      <Popover
        anchorElt={selectorRef.current}
        anchorOrigin={Popover.Origins.BOTTOM_LEFT}
        containerType={Popover.Containers.NONE}
        doNotFlip
        isOpen={isSelectorOpen}
        keepInWindow
        onRequestClose={closeSelector}
        popoverOrigin={Popover.Origins.TOP_LEFT}
      >
        <HierarchicalSelectorWrapper
          disableApplyButton={
            selectedItem === hierarchyRoot || selectedItem.id() === categoryId
          }
          hierarchyRoot={hierarchyRoot}
          onApplyButtonClick={onApplyButtonClick}
          onHierarchyPathTailChange={setSelectedItem}
          testItemSelectable={testItemSelectable}
        />
      </Popover>
    </React.Fragment>
  );
}
