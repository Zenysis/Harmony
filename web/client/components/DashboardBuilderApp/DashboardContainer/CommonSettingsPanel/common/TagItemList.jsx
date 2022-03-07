// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import type { Identifiable } from 'types/interfaces/Identifiable';
import typeof CustomizableFilterTag from 'components/common/QueryBuilder/CustomizableFilterTag';
import typeof CustomizableGroupByTag from 'components/common/QueryBuilder/CustomizableGroupByTag';

// The properties that will be passed to the `renderTag` callback so the user
// can instantiate their CustomizableFilter/GroupByTag easily.
type TagProps<T: Identifiable> = {
  className: string,
  item: T,
  key: string,
  onItemCustomized: T => void,
  onTagClick: T => void,
  onRemoveTagClick: T => void,
  onRequestCloseCustomizationModule: () => void,
  showCustomizationModule: boolean,
  showDragHandle: false,
};

type Props<T: Identifiable> = {
  onSelectedItemsChanged: (Zen.Array<T>) => void,
  renderTag: (
    props: TagProps<T>,
  ) => React.Element<CustomizableFilterTag | CustomizableGroupByTag>,
  selectedItems: Zen.Array<T>,

  // HACK(stephen): This prop is kind of a hack. We want to be able to trigger
  // the customization module when the user adds a filter, however the ownership
  // is split in such a way that TagItemList does not know when that happens.
  // To make that work, we provide this toggle prop which, when flipped from
  // false to true, will mark the last item in the `selectedItems` list as the
  // item to customize.
  customizeLastSelectedItem?: boolean,
};

export default function TagItemList<T: Identifiable>({
  onSelectedItemsChanged,
  renderTag,
  selectedItems,

  customizeLastSelectedItem = false,
}: Props<T>): React.Node {
  const [itemToCustomize, setItemToCustomize] = React.useState(undefined);
  const itemToCustomizeId =
    itemToCustomize !== undefined ? itemToCustomize.id() : undefined;
  // When the item has been customized inside the CustomizableTag, this callback
  // will be triggered. When that happens, update the selected items list with
  // the new value and close the customization module.
  const onItemCustomized = React.useCallback(
    newItem => {
      onSelectedItemsChanged(
        selectedItems.map(item =>
          item.id() === itemToCustomizeId ? newItem : item,
        ),
      );
      setItemToCustomize(undefined);
    },
    [itemToCustomizeId, onSelectedItemsChanged, selectedItems],
  );

  const onRemoveTagClick = React.useCallback(
    itemToRemove => {
      const id = itemToRemove.id();
      onSelectedItemsChanged(selectedItems.filter(item => item.id() !== id));
    },
    [onSelectedItemsChanged, selectedItems],
  );

  // When the CustomTag has been closed, this event will fire.
  const onRequestCloseCustomizationModule = React.useCallback(
    () => setItemToCustomize(undefined),
    [],
  );

  // Set the last item in the list as the item to customize if the user
  // explicitly wants it to be.
  React.useEffect(() => {
    if (selectedItems.isEmpty()) {
      return;
    }

    const lastItem = selectedItems.last();
    if (customizeLastSelectedItem) {
      setItemToCustomize(lastItem);
    }
  }, [customizeLastSelectedItem, selectedItems]);

  return (
    <div className="gd-query-section__tag-list">
      {selectedItems.mapValues(item =>
        renderTag({
          className: 'gd-query-section__tag',
          key: `tag--${item.id()}`,
          onTagClick: setItemToCustomize,
          showCustomizationModule:
            itemToCustomize !== undefined && item.id() === itemToCustomize.id(),
          showDragHandle: false,
          item,
          onItemCustomized,
          onRemoveTagClick,
          onRequestCloseCustomizationModule,
        }),
      )}
    </div>
  );
}
