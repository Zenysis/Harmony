// @flow
import * as React from 'react';

import useWindowSize from 'lib/hooks/useWindowSize';

export type GridLayout = {
  /**
   * The size of an individual cell, in pixels, on the dashboard when the
   * dashboard is at 100% zoom.
   */
  cellSize: number,

  /**
   * The number of cells that should be rendered per column. Dashboard tiles are
   * arranged at the *cell* level.
   */
  cellsPerColumn: number,

  /** The number of large columns that structure the layout of the page. */
  columnCount: number,

  /**
   * The padding, in pixels, between the left and right edges of the
   * DashboardGrid and the first/last cell in a row that a dashboard tile can be
   * placed in.
   */
  horizontalPadding: number,

  /**
   * The padding, in pixels, around the outside of a tile that will prevent it
   * from directly touching any neighboring tiles.
   *
   * NOTE(nina): This padding does not apply to text tiles (excluding
   * placeholder text tiles), since it is already included in the text system.
   */
  tilePadding: number,

  /**
   * The padding, in pixels, between the top and bottom edges of the
   * DashboardGrid and the first/last cell in a column that a dashboard tile can
   * be placed in.
   */
  verticalPadding: number,
};

const DEFAULT_MODERN_GRID_LAYOUT: GridLayout = {
  cellSize: 24,
  cellsPerColumn: 4,
  columnCount: 12,
  horizontalPadding: 32,
  tilePadding: 4,
  verticalPadding: 24,
};

const LEGACY_GRID_LAYOUT: GridLayout = {
  cellSize: 14,
  cellsPerColumn: 100,
  columnCount: 1,
  horizontalPadding: 0,
  tilePadding: 8,
  verticalPadding: 0,
};

// The collapsed grid layout will only draw a single column that is the full
// width of the user's browser. However, in order to allow for granular
// height controls (column width = row height) we use a non-zero number of
// cellsPerColumn with all tiles taking up the full width of the column.
const NUM_COLLAPSED_LAYOUT_CELLS_PER_COLUMN = 10;

/**
 * This hook returns the layout parameters for positioning dashboard tiles on a
 * grid.
 *
 * NOTE(stephen): This is designed as a hook instead of as a constant so that
 * we can experiment with the parameters live and trigger a rerender.
 */
export default function useGridLayout(
  collapse: boolean,
  legacy: boolean = false,
  layoutOverrides: $Shape<GridLayout> = {},
): [
  number, // columnCount
  number, // cellsPerColumn
  number, // cellSize
  number, // horizontalPadding
  number, // verticalPadding
  number, // tilePadding
] {
  const { width: windowWidth } = useWindowSize();
  const collapsedGridLayout = React.useMemo(
    () => ({
      cellSize: windowWidth / NUM_COLLAPSED_LAYOUT_CELLS_PER_COLUMN,
      cellsPerColumn: NUM_COLLAPSED_LAYOUT_CELLS_PER_COLUMN,
      columnCount: 1,
      horizontalPadding: 0,
      tilePadding: 8,
      verticalPadding: 0,
    }),
    [windowWidth],
  );

  let defaultLayout = DEFAULT_MODERN_GRID_LAYOUT;
  if (collapse) {
    defaultLayout = collapsedGridLayout;
  } else if (legacy) {
    defaultLayout = LEGACY_GRID_LAYOUT;
  }

  return React.useMemo(() => {
    const fullLayout = { ...defaultLayout, ...layoutOverrides };
    return [
      fullLayout.columnCount,
      fullLayout.cellsPerColumn,
      fullLayout.cellSize,
      fullLayout.horizontalPadding,
      fullLayout.verticalPadding,
      fullLayout.tilePadding,
    ];
  }, [defaultLayout, layoutOverrides]);
}
