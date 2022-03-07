// @flow
import DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';
import type Dashboard from 'models/core/Dashboard';
import type { TilePosition } from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';

function tilesCollide(tileA: TilePosition, tileB: TilePosition): boolean {
  // NOTE(david): There are two cases where tiles don't overlap: either one tile
  // is to the left of the other or one tile is above the other (or both). We
  // check both these cases and if neither are valid then there is a collison.

  // One rectangle is to the left of the other
  if (
    tileB.x + tileB.columnCount <= tileA.x ||
    tileB.x >= tileA.x + tileA.columnCount
  ) {
    return false;
  }

  // One rectangle is above the other
  if (
    tileB.y + tileB.rowCount <= tileA.y ||
    tileB.y >= tileA.y + tileA.rowCount
  ) {
    return false;
  }

  return true;
}

function positionIsValid(
  tilePosition: TilePosition,
  existingTiles: $ReadOnlyArray<TilePosition>,
  dashboardColumnCount: number,
): boolean {
  if (tilePosition.x + tilePosition.columnCount > dashboardColumnCount) {
    return false;
  }

  return existingTiles.every(
    existingTilePosition => !tilesCollide(tilePosition, existingTilePosition),
  );
}

/**
 * Find the best position the cloned tile should be placed. The cloned tile
 * should be placed as close as possible to the original tile without displacing
 * any other tiles. It should also be placed *after* the original tile.
 * TODO(david): Revist how we position cloned tiles when we move to vertically
 * compacting dashboards
 */
function findBestNewTilePosition(
  dashboard: Dashboard,
  originalPosition: TilePosition,
  dashboardColumnCount: number, // eslint-disable-line no-unused-vars
): TilePosition {
  let yMax = originalPosition.y + originalPosition.rowCount;

  const tilePositions = dashboard
    .specification()
    .items()
    .map(itemHolder => {
      const position = itemHolder.position();
      yMax = Math.max(yMax, position.y + position.rowCount);
      return position;
    });

  // First try positioning the tile to the right of the cloned tile
  const tileOnRight = {
    columnCount: originalPosition.columnCount,
    rowCount: originalPosition.rowCount,
    x: originalPosition.x + originalPosition.columnCount,
    y: originalPosition.y,
  };
  if (positionIsValid(tileOnRight, tilePositions, dashboardColumnCount)) {
    return tileOnRight;
  }

  // Then try positioning the tile below the cloned tile
  const tileBelow = {
    columnCount: originalPosition.columnCount,
    rowCount: originalPosition.rowCount,
    x: originalPosition.x,
    y: originalPosition.y + originalPosition.rowCount,
  };
  if (positionIsValid(tileBelow, tilePositions, dashboardColumnCount)) {
    return tileBelow;
  }

  // Finally default to adding the tile at the bottom of the dashboard
  return {
    columnCount: originalPosition.columnCount,
    rowCount: originalPosition.rowCount,
    x: 0,
    y: yMax + 1,
  };
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
): Dashboard {
  const position = findBestNewTilePosition(
    dashboard,
    itemHolder.position(),
    columnCount,
  );
  const clonedItem = DashboardItemHolder.createWithUniqueId(
    itemHolder.item(),
    position,
  );

  const newItems = [...dashboard.specification().items(), clonedItem];

  return dashboard
    .deepUpdate()
    .specification()
    .items(newItems);
}
