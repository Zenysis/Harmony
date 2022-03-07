// @flow
import * as React from 'react';
import type { LayoutItem as ReactGridPosition } from 'react-grid-layout/lib/utils';

import measureTextTileHeight from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/TextTile/measureTextTileHeight';
import useWindowSize from 'lib/hooks/useWindowSize';
import { VISUALIZATION_TYPE } from 'models/AdvancedQueryApp/VisualizationType/registry';
import type DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';
import type DashboardTextItem from 'models/DashboardBuilderApp/DashboardItem/DashboardTextItem';

/**
 * In collapsed layout, each tile takes up the full width of the dashboard. For
 * most tiles we aim for their height to take up the entire viewport. The
 * exceptions are number/trend visualizations, which are smaller, and text items
 * which are sized according to how much space the text takes up.
 */
function buildCollapsedTilePosition(
  itemHolder: DashboardItemHolder,
  cellsPerRow: number,
  cellSize: number,
  tilePadding: number,
  windowHeight: number,
  width: number,
  yPosition: number,
): ReactGridPosition {
  const item = itemHolder.item();

  let tileHeight = Math.floor(windowHeight / cellSize);

  // Query items that render a number trend visualization should take up a
  // smaller area than other visualizations.
  if (item.tag === 'QUERY_ITEM') {
    const visualizationType = item.visualizationType();
    if (
      visualizationType === VISUALIZATION_TYPE.NUMBER_TREND ||
      visualizationType === VISUALIZATION_TYPE.NUMBER_TREND_SPARK_LINE
    ) {
      tileHeight = Math.floor(tileHeight / 2);
    }
  } else if (item.tag === 'TEXT_ITEM') {
    // For text tiles we size them according to the height of the text
    tileHeight = Math.ceil(measureTextTileHeight(item, width) / cellSize);
  }

  return {
    h: tileHeight,
    i: itemHolder.id(),
    w: cellsPerRow,
    x: 0,
    y: yPosition,
  };
}

/**
 * For text tiles we have two modes. If autosize is on, we automatically size
 * the content according to the height of the text. If it is off, we use just
 * use the autosized height as a minimum height.
 */
function getTextTileHeight(
  item: DashboardTextItem,
  currentPosition: ReactGridPosition,
  cellSize: number,
): number {
  const width = cellSize * currentPosition.w;
  const minTileHeight = Math.ceil(
    measureTextTileHeight(item, width) / cellSize,
  );

  return item.autosize()
    ? minTileHeight
    : Math.max(currentPosition.h, minTileHeight);
}

/**
 * Build the postion of a tile. In most cases this is the same as the stored
 * position. The exception is for text tiles which we special case to make
 * sure that they don't cut off any text
 */
function buildTilePosition(
  itemHolder: DashboardItemHolder,
  cellSize: number,
  legacy: boolean,
): ReactGridPosition {
  const item = itemHolder.item();
  const currentPosition = itemHolder.reactGridPosition();

  if (item.tag !== 'TEXT_ITEM' || legacy) {
    return currentPosition;
  }

  return {
    ...currentPosition,
    h: getTextTileHeight(item, currentPosition, cellSize),
  };
}

/**
 * Provides the layout of the tiles for the dashboard. Normally this is just the
 * values stored on each DashboardItemHolder model. However, in collapsed
 * layout mode, we impose our own layout.
 */
export default function useLayout(
  items: $ReadOnlyArray<DashboardItemHolder>,
  collapse: boolean,
  cellSize: number,
  cellsPerRow: number,
  tilePadding: number,
  width: number,
  legacy: boolean,
): $ReadOnlyArray<ReactGridPosition> {
  const { height: windowHeight } = useWindowSize();

  // NOTE(stephen): Memoizing these position builders separately so that the
  // common case, when the dashboard is *not* in collapsed layout mode, can
  // take a fast path and avoid rebuilding the array any time the parameters
  // needed for building a collapsed layout change.
  const fullLayoutGridPositions = React.useMemo(
    () =>
      !collapse
        ? items.map(item => buildTilePosition(item, cellSize, legacy))
        : [],
    [cellSize, collapse, items, legacy],
  );

  const collapsedLayoutGridPositions = React.useMemo(() => {
    if (!collapse) {
      return [];
    }

    // Sort the dashboard items from top-left to bottom-right and use the sorted
    // value as the y-position for the collapsed tile. This ensures the
    // dashboard tiles are shown in the correct order.
    return items
      .slice()
      .sort((a, b) => {
        const aPosition = a.position();
        const bPosition = b.position();
        if (aPosition.y === bPosition.y) {
          return aPosition.x < bPosition.x ? -1 : 1;
        }

        return aPosition.y < bPosition.y ? -1 : 1;
      })
      .map((item, idx) =>
        buildCollapsedTilePosition(
          item,
          cellsPerRow,
          cellSize,
          tilePadding,
          windowHeight,
          width,
          idx,
        ),
      );
  }, [collapse, cellsPerRow, cellSize, items, tilePadding, width, windowHeight]);

  return collapse ? collapsedLayoutGridPositions : fullLayoutGridPositions;
}
