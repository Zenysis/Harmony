// @flow
import DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';
import type Dashboard from 'models/core/Dashboard';
import type { TilePosition } from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';

/**
 * Find the best position the cloned tile should be placed. The cloned tile
 * should be placed as close as possible to the original tile without displacing
 * any other tiles. It should also be placed *after* the original tile.
 * TODO: Revist how we position cloned tiles when we move to vertically
 * compacting dashboards
 */
function findBestNewTilePosition(
  items: $ReadOnlyArray<DashboardItemHolder>,
  itemHolder: DashboardItemHolder,
  dashboardCellsPerRow: number,
): [number, TilePosition] {
  const oldTilePosition = itemHolder.position();
  const idx = items.indexOf(itemHolder);
  const nextItem = items[idx + 1];
  const nextItemPosition = nextItem ? nextItem.position() : undefined;
  const right = oldTilePosition.x + oldTilePosition.columnCount;
  const isNextItemOnSameLine = nextItemPosition && right <= nextItemPosition.x;

  // First try positioning the tile to the right of the cloned tile
  const maxRight =
    nextItemPosition && isNextItemOnSameLine
      ? nextItemPosition.x
      : dashboardCellsPerRow;
  if (right + oldTilePosition.columnCount <= maxRight) {
    const newPosition = {
      ...oldTilePosition,
      x: right,
    };
    return [idx + 1, newPosition];
  }

  // Then try positioning the tile below the cloned tile
  const firstItemOnNextRow = items
    .slice(idx + 1)
    .find((item: DashboardItemHolder): boolean => {
      const itemPosition = item.position();
      return itemPosition.x < right;
    });
  if (!firstItemOnNextRow || right < firstItemOnNextRow.position().x) {
    const newPosition = {
      ...oldTilePosition,
      x: oldTilePosition.x,
    };
    return [items.indexOf(firstItemOnNextRow), newPosition];
  }
  // Finally default to adding the tile at the bottom of the dashboard
  const newPosition = {
    ...oldTilePosition,
    x: 0,
  };
  return [items.length, newPosition];
}

/**
 * Clones a tile and adds the new clone to the dashboard. The cloned tile will
 * have the exact same settings as the original but will be placed in a new
 * position and will have a new ID.
 */
export default function updateDashboardOnItemClone(
  itemHolder: DashboardItemHolder,
  dashboard: Dashboard,
  columnCount: number,
  cellsPerColumn: number,
): Dashboard {
  const items = dashboard.specification().items();
  const [idx, position] = findBestNewTilePosition(
    items,
    itemHolder,
    columnCount * cellsPerColumn,
  );
  const clonedItem = DashboardItemHolder.createWithUniqueId(
    itemHolder.item(),
    position,
  );

  const newItems = [...items.slice(0, idx), clonedItem, ...items.slice(idx)];

  return dashboard
    .deepUpdate()
    .specification()
    .items(newItems);
}
