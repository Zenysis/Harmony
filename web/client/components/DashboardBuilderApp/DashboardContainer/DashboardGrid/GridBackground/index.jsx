// @flow
import * as React from 'react';

import LegacyGridBackground from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/GridBackground/LegacyGridBackground';
import PageBreakMarkers from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/GridBackground/PageBreakMarkers';
import buildBackgroundStyleDefinition, {
  buildMergedBackgroundStyleDefinition,
} from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/GridBackground/buildBackgroundStyleDefinition';
import useElementSize from 'lib/hooks/useElementSize';

type Props = {
  cellsPerColumn: number,
  cellSize: number,
  columnCount: number,
  horizontalPadding: number,
  repositioningTiles: boolean,
  showGridlines: boolean,
  verticalPadding: number,
  zoomLevel: number,
};

/**
 * The GridBackground component renders a styled page underneath the dashboard
 * tiles. It looks like a piece of paper, and it helps provide a nice boundary
 * for the user to build a dashboard inside. Optionally, grid lines will be
 * drawn to help the user more easily lay out the dashboard on the page.
 */
function GridBackground({
  cellsPerColumn,
  cellSize,
  columnCount,
  horizontalPadding,
  repositioningTiles,
  showGridlines,
  verticalPadding,
  zoomLevel,
}: Props) {
  const [{ height: backgroundHeight }, backgroundRef] = useElementSize();

  const innerGridWidth = cellsPerColumn * cellSize * columnCount;
  const fullPageWidth = innerGridWidth + 2 * horizontalPadding;

  // HACK(stephen): To avoid passing `legacy` flags all over the place, we can
  // derive if we are in a legacy mode by checking how many cellsPerColumn are
  // being used. This value only exists in legacy mode, and when legacy mode
  // is removed, this code can be removed too.
  const legacy = cellsPerColumn === 100;
  if (legacy) {
    if (!showGridlines || !repositioningTiles) {
      return null;
    }

    return (
      <LegacyGridBackground
        cellsPerColumn={cellsPerColumn}
        cellSize={cellSize}
        columnCount={columnCount}
        zoomLevel={zoomLevel}
      />
    );
  }

  function buildGridLinesBackground() {
    // The primary column lines provide visual structure to the grid. There are
    // fewer lines than cells (usually 12), and they help set a simple boundary.
    // This helps the user to line up different tiles by being able to base the
    // tiles position on the primary column line instead of having to determine
    // its absolute horizontal position from the left of the page.
    const primaryColumnLines = buildBackgroundStyleDefinition(
      `repeating-linear-gradient(
        -90deg,
        rgba(235, 0, 255, 0.2),
        rgba(235, 0, 255, 0.2) 1px,
        transparent 1px,
        transparent ${cellsPerColumn * cellSize}px
      )`,
      `${horizontalPadding}px 0`,
      `${innerGridWidth + 1}px`,
    );

    // The left and right column boundary lines are slightly darker, and the
    // goal is to indicate to the user that no tiles can be placed outside those
    // boundaries.
    const leftRightColumnBoundaryLines = buildBackgroundStyleDefinition(
      `repeating-linear-gradient(
        -90deg,
        rgba(0, 0, 0, 0.12),
        rgba(0, 0, 0, 0.12) 1px,
        transparent 1px,
        transparent ${innerGridWidth}px
      )`,
      `${horizontalPadding}px 0`,
      `${innerGridWidth + 1}px`,
    );

    // The cell column lines are drawn in between primary column lines. These
    // are a little fainter, and the goal is to help users position a tile
    // within a primary column. There is always `cellsPerColumn - 1` lines per
    // column since we want to avoid drawing a line on top of the primary column
    // lines.
    const cellColumnLines = buildBackgroundStyleDefinition(
      `repeating-linear-gradient(
        -90deg,
        rgba(0, 0, 0, 0.06),
        rgba(0, 0, 0, 0.06) 1px,
        transparent 1px,
        transparent ${cellSize}px
      )`,
      `${horizontalPadding}px 0`,
      `${innerGridWidth - cellSize + 1}px`,
    );

    // To make it easier to draw rows, we introduce a white box inside the
    // vertical padding section at the top of the page. This is a developer
    // convenience since this white box will get drawn on top of the row lines,
    // effectively blocking them from view (if they are drawn in the vertical
    // padding section).
    const verticalPaddingRowBlock = buildBackgroundStyleDefinition(
      `linear-gradient(white, white)`,
      '0 0',
      `auto ${verticalPadding - 1}px`,
    );

    // The row lines stretch from the bottom of the vertical padding section
    // through the end of the page.
    const rowLines = buildBackgroundStyleDefinition(
      `repeating-linear-gradient(
        0deg,
        rgba(0, 41, 255, 0.06),
        rgba(0, 41, 255, 0.06) 1px,
        transparent 1px,
        transparent ${cellSize}px
      )`,
      `0 ${verticalPadding}px`,
      `auto ${cellSize}px`,
      'repeat-y',
    );

    // The top row boundary line is slightly darker and indicates to the user
    // that no tiles can be placed above this point on the page.
    const topRowBoundaryLine = buildBackgroundStyleDefinition(
      'linear-gradient(rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.12) 1px)',
      `0 ${verticalPadding - 1}px`,
      'auto 1px',
    );

    const backgroundOrder = [
      primaryColumnLines,
      leftRightColumnBoundaryLines,
      cellColumnLines,
      verticalPaddingRowBlock,
      rowLines,
      topRowBoundaryLine,
    ];

    return buildMergedBackgroundStyleDefinition(backgroundOrder);
  }

  const style = {
    ...(showGridlines ? buildGridLinesBackground() : undefined),

    // Clear the border radius on the bottom when the grid is being shown
    // because we don't want to send the signal that the grid page the user
    // sees is all the space that they have to work with.
    borderRadius: showGridlines ? '6px 6px 0 0' : '6px',
    height: `calc(100% / ${zoomLevel})`,

    // NOTE(stephen): Including `translateZ` to force GPU rendering of the
    // background which improves the crispness of the lines at lower zoom
    // levels. Without this, the grid lines can disappear at low zoom levels
    // (like 0.5).
    transform: `scale(${zoomLevel}) translateZ(0px)`,
    width: `${innerGridWidth + 2 * horizontalPadding}px`,
  };

  return (
    <>
      {!legacy && (
        <PageBreakMarkers
          gridHeight={backgroundHeight}
          pageWidth={fullPageWidth}
          repositioningTiles={repositioningTiles}
          zoomLevel={zoomLevel}
        />
      )}
      <div className="gd-grid-background" ref={backgroundRef} style={style} />
    </>
  );
}

export default (React.memo(GridBackground): React.AbstractComponent<Props>);
