// @flow

import type { ZoomSetting } from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton/DashboardZoomLevelButton';

// Dashboard minimum grid size
//   860  (min width of `react-grid-layout`)
// + 64   (2*gridContainerHorizontalPadding = 2*32)
// + 48   (2*horizontalPadding*zoomLevel = 2*32*0.75)
// -----
// = 972
const MIN_GRID_CONTAINER_WIDTH = 972;

/**
 * Calculate the required zoom level for the dashboard grid based on
 * the current zoom setting, the size of the container and various layout
 * settings.
 */
export default function calculateZoomLevel(
  cellsPerColumn: number,
  cellSize: number,
  columnCount: number,
  gridContainerHorizontalPadding: number,
  gridContainerWidth: number,
  horizontalPadding: number,
  legacy: boolean,
  collapse: boolean,
  zoomSetting: ZoomSetting,
): number {
  // The zoom level should always be 100% when we are collapsed layout mode.
  if (collapse) {
    return 1;
  }

  // NOTE(stephen, david): In legacy dashboard mode we need to draw
  // the DashboardGrid to take up 100% of its container. The grid layout
  // does not have to change (i.e. the cellSize remains constant), and
  // we can control everything through zoom.
  if (legacy) {
    // The target grid width is the unscaled length of one row + padding.
    const targetGridWidth =
      columnCount * cellsPerColumn * cellSize + horizontalPadding * 2;
    const gridWidth = gridContainerWidth - 2 * gridContainerHorizontalPadding;
    return gridWidth / targetGridWidth;
  }

  // NOTE(isabel): In fit width dashboard mode, we draw the DashboardGrid to
  // take up all of its container but fix the grid width if a min width
  // threshold is reached.
  if (zoomSetting === 'fit') {
    // The target grid width is the unscaled length of one row + padding.
    const targetGridWidth =
      columnCount * cellsPerColumn * cellSize + horizontalPadding * 2;
    const availableSpace =
      gridContainerWidth - 2 * gridContainerHorizontalPadding;

    // Respect minimum grid width
    const adjustedGridContainerWidth = Math.max(
      gridContainerWidth,
      MIN_GRID_CONTAINER_WIDTH,
    );

    const gridWidth =
      adjustedGridContainerWidth - 2 * gridContainerHorizontalPadding;
    return gridWidth / targetGridWidth;
  }

  // If we are not in legacy or fit width mode, zoomSetting is just a number,
  // and we can directly use that number.
  return zoomSetting;
}
