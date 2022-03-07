// @flow
import * as React from 'react';
import invariant from 'invariant';
import type { LayoutItem as ReactGridPosition } from 'react-grid-layout/lib/utils';

import measureTextTileHeight from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/TextTile/measureTextTileHeight';
import type DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';

/**
 * If a text tile is repositioned, then we need to update its autosize setting.
 * If a user tries to set a height less than or equal to the minimum height to
 * fit the text, we turn autosize on. If a user sets a height greater than the
 * minimum height to fit the text, then we turn it off to allow for whitespace.
 *
 * NOTE(david): The actual autosizing is done in the useLayout hook. This update
 * relies on the fact that for any user made changes to the layout, this update
 * will be triggered first before useLayout. For changes to the text item
 * content, this will not be called until after useLayout has run and any
 * auto-sizing has been performed.
 */
function updateTextTileAutosizeSetting(
  itemHolder: DashboardItemHolder,
  cellSize: number,
): DashboardItemHolder {
  const { item, position } = itemHolder.modelValues();

  invariant(item.tag === 'TEXT_ITEM', 'We can only autosize text tiles.');

  const width = position.columnCount * cellSize;
  const minHeight = Math.ceil(measureTextTileHeight(item, width) / cellSize);
  const newHeight = position.rowCount;

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
): ($ReadOnlyArray<ReactGridPosition>) => void {
  return React.useCallback(
    newLayout => {
      if (collapse) {
        // NOTE(david): No layout changes can be made in collapsed layout as we
        // override the default layout. These changes should not be persisted.
        return;
      }

      const updatedItems = items.map((item, idx) => {
        const newItemReactGridPosition = newLayout[idx];
        if (item.doesReactGridPositionMatch(newItemReactGridPosition)) {
          return item;
        }

        const repositionedItem = item.updatePositionFromReactGrid(
          newItemReactGridPosition,
        );

        // Changes to the size of a text tile can affect its autosize property.
        // This implements those updates.
        if (
          repositionedItem.item().tag === 'TEXT_ITEM' &&
          !item.doReactGridDimensionsMatch(newItemReactGridPosition) &&
          !legacy
        ) {
          return updateTextTileAutosizeSetting(repositionedItem, cellSize);
        }

        return repositionedItem;
      });

      onItemsChange(updatedItems);
    },
    [cellSize, collapse, items, legacy, onItemsChange],
  );
}
