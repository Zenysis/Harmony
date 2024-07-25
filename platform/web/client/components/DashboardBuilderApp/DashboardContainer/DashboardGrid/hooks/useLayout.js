// @flow
import * as React from 'react';
import type { LayoutItem as ReactGridPosition } from 'react-grid-layout/lib/utils';

import useWindowSize from 'lib/hooks/useWindowSize';
import { VISUALIZATION_TYPE } from 'models/AdvancedQueryApp/VisualizationType/registry';
import type DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';

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
  heightsOverrides: Map<string, number>,
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
  }

  return {
    h: heightsOverrides.get(itemHolder.id()) || tileHeight,
    i: itemHolder.id(),
    resizeHandles:
      (heightsOverrides.has(itemHolder.id()) && ['w', 'e']) || undefined,
    w: cellsPerRow,
    x: 0,
    y: yPosition,
  };
}

/**
 * Build the postion of a tile. We need to figure out what's the y-position
 * of a tile based on it's order in the items array. If tile does not
 * fit on the current line, it means it goes to the next line.
 * Also, make use of an overriden heights for some of the tiles and
 * calculate the height of text tiles, and use it instead of the stored one.
 */
function buildTilePosition(
  itemHolder: DashboardItemHolder,
  cellSize: number,
  legacy: boolean,
  heightsOverrides: Map<string, number>,
  positions,
): ReactGridPosition {
  const currentPosition = itemHolder.reactGridPosition();

  let tilePosition;
  const item = itemHolder.item();
  const autosizeDisabled = item.tag === 'TEXT_ITEM' && !item.autosize();
  if (!autosizeDisabled && heightsOverrides.has(itemHolder.id())) {
    tilePosition = {
      ...currentPosition,
      h: heightsOverrides.get(itemHolder.id()) || 0,
    };
  } else {
    tilePosition = currentPosition;
  }

  // NOTE: this has a complexity of O(n^2) because we go through
  // all tiles to position every tile, which is quite bad. This can be
  // improved significantly if we use a priority queue (like heap) and
  // use it to store all the bottom coordinates of each tile in decreasing
  // order. Then, to find what tile we want to bubble to is just to find
  // the closest to the top of the queue tile which intersects with the
  // current one. To update the queue is O(log n), so total complexity is
  // now just O(n*log n). But that requires the implementation of heap
  // to be added to the project and since dashboards are usually small
  // (like, under 100 tiles?), it seems to be an overkill to me.
  const intersectHorizontally = positions
    .filter(position => {
      const [px1, px2] = [position.x, position.x + position.w];
      const [tx1, tx2] = [tilePosition.x, tilePosition.x + tilePosition.w];
      return (
        (tx1 >= px1 && tx1 < px2) ||
        (tx2 > px1 && tx2 <= px2) ||
        (tx1 < px1 && tx2 > px2)
      );
    })
    .sort((a, b) => b.y + b.h - (a.y + a.h));
  const bubbleTo = intersectHorizontally[0];
  tilePosition.y = bubbleTo ? bubbleTo.y + bubbleTo.h : 0;
  if (
    heightsOverrides.has(itemHolder.id()) &&
    itemHolder.item().tag !== 'TEXT_ITEM'
  ) {
    tilePosition.resizeHandles = ['w', 'e'];
  }
  return tilePosition;
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
  heightsOverrides: Map<string, number>,
): $ReadOnlyArray<ReactGridPosition> {
  const { height: windowHeight } = useWindowSize();

  // NOTE: Memoizing these position builders separately so that the
  // common case, when the dashboard is *not* in collapsed layout mode, can
  // take a fast path and avoid rebuilding the array any time the parameters
  // needed for building a collapsed layout change.
  window.y = 0;
  window.maxH = 0;
  const fullLayoutGridPositions = React.useMemo(() => {
    if (collapse) {
      return [];
    }
    return items.reduce((positions, item) => {
      const tilePosition = buildTilePosition(
        item,
        cellSize,
        legacy,
        heightsOverrides,
        positions,
      );
      return [...positions, tilePosition];
    }, []);
  }, [cellSize, collapse, items, legacy, heightsOverrides]);

  const collapsedLayoutGridPositions = React.useMemo(() => {
    if (!collapse) {
      return [];
    }

    // Sort the dashboard items from top-left to bottom-right and use the sorted
    // value as the y-position for the collapsed tile. This ensures the
    // dashboard tiles are shown in the correct order.
    return items
      .slice()
      .map((item, idx) =>
        buildCollapsedTilePosition(
          item,
          cellsPerRow,
          cellSize,
          tilePadding,
          windowHeight,
          width,
          idx,
          heightsOverrides,
        ),
      );
  }, [
    collapse,
    cellsPerRow,
    cellSize,
    items,
    heightsOverrides,
    tilePadding,
    width,
    windowHeight,
  ]);

  return collapse ? collapsedLayoutGridPositions : fullLayoutGridPositions;
}
