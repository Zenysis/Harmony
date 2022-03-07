// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import buildBackgroundStyleDefinition, {
  buildMergedBackgroundStyleDefinition,
} from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/GridBackground/buildBackgroundStyleDefinition';
import {
  A4_PAGE_HEIGHT,
  A4_PAGE_WIDTH,
} from 'components/DashboardBuilderApp/DashboardScreenshotApp/screenshotUtil';

type Props = {
  cellsPerColumn: number,
  cellSize: number,
  columnCount: number,
  zoomLevel: number,
};

/**
 * The LegacyGridBackground emulates the original grid line behavior that
 * existed in the legacy GridDashboardApp.
 */
function LegacyGridBackground({
  cellsPerColumn,
  cellSize,
  columnCount,
  zoomLevel,
}: Props) {
  const a4CellSize = A4_PAGE_WIDTH / (cellsPerColumn * columnCount);
  const a4ZoomLevel = cellSize / a4CellSize;
  const pageDividerHeight = A4_PAGE_HEIGHT * a4ZoomLevel;

  // The page divider indicates to the user that tiles that cross this boundary
  // will be drawn on a separate page when a PDF is built.
  const legacyPageDividerStr = encodeURIComponent(`
    <svg height="${pageDividerHeight}" width="100%" xmlns="http://www.w3.org/2000/svg">
      <line stroke="#313234" stroke-dasharray="4" stroke-width="1.5" x1="0" x2="100%" y1="100%" y2="100%" />
      <text x="8" y="100%" dy="-8" fill="#313234">${I18N.text(
        'Page Break',
      )}</text>
    </svg>
  `);

  const pageDividerBackground = buildBackgroundStyleDefinition(
    `url(data:image/svg+xml;utf8,${legacyPageDividerStr})`,
    '0 0',
    `auto ${pageDividerHeight}px`,
    'repeat-y',
  );

  const columnLines = buildBackgroundStyleDefinition(
    `repeating-linear-gradient(
      -90deg,
      rgba(204, 204, 204, 1),
      rgba(204, 204, 204, 1) 1px,
      transparent 1px,
      transparent ${cellSize}px
    )`,
    '0 0',
    `${cellSize}px auto`,
    'repeat-x',
  );
  const rowLines = buildBackgroundStyleDefinition(
    `repeating-linear-gradient(
      0deg,
      rgba(204, 204, 204, 1),
      rgba(204, 204, 204, 1) 1px,
      transparent 1px,
      transparent ${cellSize}px
    )`,
    '0 0',
    `auto ${cellSize}px`,
    'repeat-y',
  );

  const backgroundDefinition = buildMergedBackgroundStyleDefinition([
    pageDividerBackground,
    columnLines,
    rowLines,
  ]);

  const style = {
    ...backgroundDefinition,

    height: `calc(100% / ${zoomLevel})`,
    left: 0,
    position: 'absolute',
    top: 0,
    transform: `scale(${zoomLevel})`,
    transformOrigin: 'top left',
    width: `calc(100% / ${zoomLevel})`,
  };

  return <div className="gd-grid-background-legacy" style={style} />;
}

export default (React.memo(
  LegacyGridBackground,
): React.AbstractComponent<Props>);
