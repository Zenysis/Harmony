// @flow
import * as React from 'react';
import invariant from 'invariant';
import type { LayoutItem as ReactGridPosition } from 'react-grid-layout/lib/utils';

import type DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';

/**
 * If a text tile is repositioned, then we need to update its autosize setting.
 * If a user tries to set a height less than or equal to the minimum height to
 * fit the text, we turn autosize on. If a user sets a height greater than the
 * minimum height to fit the text, then we turn it off to allow for whitespace.
 *
 * NOTE: The actual autosizing is done in the useLayout hook. This update
 * relies on the fact that for any user made changes to the layout, this update
 * will be triggered first before useLayout. For changes to the text item
 * content, this will not be called until after useLayout has run and any
 * auto-sizing has been performed.
 */
function updateTextTileAutosizeSetting(
  itemHolder: DashboardItemHolder,
  cellSize: number,
  heightsOverrides: Map<string, number>,
  position: ReactGridPosition,
): DashboardItemHolder {
  const { item } = itemHolder.modelValues();

  invariant(item.tag === 'TEXT_ITEM', 'We can only autosize text tiles.');

  const minHeight = heightsOverrides.get(itemHolder.id());
  const newHeight = position.h;

  if (minHeight === undefined) {
    return itemHolder;
  }

  const autosize = newHeight <= minHeight;

  if (autosize === item.autosize()) {
    return itemHolder;
  }

  const newItem = item.autosize(autosize);
  invariant(newItem.tag === 'TEXT_ITEM', 'We can only autosize text tiles.');
  return itemHolder.item(newItem);
}

/** Publish any tile position changes that were made by the user. */
export default function useLayoutChange(
  items: $ReadOnlyArray<DashboardItemHolder>,
  onItemsChange: ($ReadOnlyArray<DashboardItemHolder>) => void,
  collapse: boolean,
  cellSize: number,
  legacy: boolean,
  heightsOverrides: Map<string, number>,
): ($ReadOnlyArray<ReactGridPosition>) => void {
  return React.useCallback(
    newLayout => {
      if (collapse) {
        // NOTE: No layout changes can be made in collapsed layout as we
        // override the default layout. These changes should not be persisted.
        return;
      }

      const sortedNewLayout = newLayout
        .slice()
        .sort((a, b) => a.y - b.y || a.x - b.x);

      const itemsIdMap: Map<string, DashboardItemHolder> = new Map(
        items.map(item => [item.id(), item]),
      );

      const updatedItems = sortedNewLayout.map(newItemReactGridPosition => {
        const itemHolder = itemsIdMap.get(newItemReactGridPosition.i);
        if (!itemHolder) {
          throw new Error('Can not be here');
        }

        // Changes to the size of a text tile can affect its autosize property.
        // This implements those updates.
        const item = itemHolder.item();
        const autosizeUpdatedItemHolder =
          item.tag === 'TEXT_ITEM' &&
          !itemHolder.doReactGridDimensionsMatch(newItemReactGridPosition) &&
          !legacy
            ? updateTextTileAutosizeSetting(
                itemHolder,
                cellSize,
                heightsOverrides,
                newItemReactGridPosition,
              )
            : itemHolder;

        const autosizeUpdatedItem = autosizeUpdatedItemHolder.item();
        const skipHeight =
          autosizeUpdatedItem.tag === 'TEXT_ITEM'
            ? autosizeUpdatedItem.autosize()
            : heightsOverrides.has(itemHolder.id());
        if (
          autosizeUpdatedItemHolder.doesReactGridPositionMatch(
            newItemReactGridPosition,
            skipHeight,
          )
        ) {
          return autosizeUpdatedItemHolder;
        }

        const repositionedItem = autosizeUpdatedItemHolder.updatePositionFromReactGrid(
          newItemReactGridPosition,
        );

        return repositionedItem;
      });

      onItemsChange(updatedItems);
    },
    [cellSize, collapse, items, legacy, onItemsChange, heightsOverrides],
  );
}
