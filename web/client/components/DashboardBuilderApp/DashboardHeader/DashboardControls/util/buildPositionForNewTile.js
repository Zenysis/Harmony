// @flow
import type DashboardItemHolder, {
  TilePosition,
} from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';

/**
 * Builds the Position model for a new tile on the dashboard app. We add the new
 * tile to the bottom of the dashboard.
 */
export default function buildPositionForNewTile(
  items: $ReadOnlyArray<DashboardItemHolder>,
  tileType: 'divider' | 'gis' | 'iframe' | 'query' | 'spacer' | 'text_item',
  legacy: boolean,
): TilePosition {
  // Find the largest vertical position that any tile on the dashboard occupies.
  const yMax = items.reduce((currentYMax, item) => {
    const position = item.position();
    const itemYMax = position.y + position.rowCount;
    return Math.max(currentYMax, itemYMax);
  }, 0);

  const position = {
    columnCount: 48,
    rowCount: 5,
    x: 0,
    y: yMax,
  };

  if (tileType === 'query' || tileType === 'gis') {
    position.columnCount = 24;
    position.rowCount = 18;
  } else if (tileType === 'iframe') {
    position.rowCount = 24;
  } else if (tileType === 'spacer') {
    position.rowCount = 3;
  } else if (tileType === 'divider') {
    position.rowCount = 4;
  }

  // TODO(stephen): Remove this when legacy styling is removed from the
  // dashboard. This is kept in for now since we don't have a clear idea of how
  // users will work with legacy dashboards at the same time as having modern
  // dashboards.
  if (legacy) {
    position.columnCount = 75;
    position.rowCount = 50;
  }

  return position;
}
