// @flow
import DashboardGISItem from 'models/DashboardBuilderApp/DashboardItem/DashboardGISItem';
import DashboardQueryItem from 'models/DashboardBuilderApp/DashboardItem/DashboardQueryItem';
import { VISUALIZATION_TYPE } from 'models/AdvancedQueryApp/VisualizationType/registry';
import type { TilePosition } from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';

const FULL_WIDTH_VISUALIZATION_TYPES = [
  VISUALIZATION_TYPE.HEATTILES,
  VISUALIZATION_TYPE.MAP,
  VISUALIZATION_TYPE.MAP_ANIMATED,
  VISUALIZATION_TYPE.MAP_HEATMAP,
  VISUALIZATION_TYPE.MAP_HEATMAP_ANIMATED,
  VISUALIZATION_TYPE.RANKING,
  VISUALIZATION_TYPE.TABLE,
  VISUALIZATION_TYPE.TABLE_SCORECARD,
];

/**
 * Build a default tile position for new items that added to a dashboard
 * directly from the AdvancedQueryApp and GeoMappingApp.
 */
export default function buildDefaultTilePosition(
  item: DashboardQueryItem | DashboardGISItem,
): TilePosition {
  if (item.tag === 'GIS_ITEM') {
    return {
      columnCount: 48,
      rowCount: 24,
      x: 0,
      y: 0,
    };
  }

  // The default position for query tiles is half width and 18 cells high.
  const output = {
    columnCount: 24,
    rowCount: 18,
    x: 0,
    y: 0,
  };
  const visualizationType = item.visualizationType();
  if (FULL_WIDTH_VISUALIZATION_TYPES.includes(visualizationType)) {
    output.columnCount = 48;
    output.rowCount = 24;
  } else if (
    visualizationType === VISUALIZATION_TYPE.NUMBER_TREND ||
    visualizationType === VISUALIZATION_TYPE.NUMBER_TREND_SPARK_LINE
  ) {
    output.columnCount = 12;
    output.rowCount = 9;
  }

  return output;
}
