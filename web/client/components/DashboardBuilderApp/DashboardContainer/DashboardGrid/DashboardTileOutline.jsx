// @flow
import * as React from 'react';
import classNames from 'classnames';
import type { LayoutItem as ReactGridPosition } from 'react-grid-layout/lib/utils';

type Props = {
  cellSize: number,
  dragging: boolean,
  editing: boolean,
  horizontalPadding: number,
  hoverTileId: string | void,
  layout: $ReadOnlyArray<ReactGridPosition>,
  resizing: boolean,
  selectedTileId: string | void,
  verticalPadding: number,
  zoomLevel: number,
};

const DASH_SIZE = 7;

function getTileOverlayColor(
  tileIsSelected: boolean,
  dragging: boolean,
  resizing: boolean,
): string {
  if (!dragging && !resizing) {
    return 'transparent';
  }

  if (tileIsSelected) {
    return '#0f6fff';
  }

  // We only add an overlay to non-selected tiles when there is a resize event
  // in progress.
  return resizing ? '#091e42' : 'transparent';
}

// NOTE(stephen): This resize handle isn't actually hooked up. We just draw it
// on top of react-grid-layout's handle so that we don't have to do any of the
// hard work. This also allows us to scale the resize handle cleanly when the
// zoom level changes.
function renderResizeHandle(x: number, y: number) {
  return (
    <rect
      className="gd-dashboard-tile-outline__resize-handle"
      height="6"
      width="6"
      x={x - 6 / 2}
      y={y - 6 / 2}
    />
  );
}

/**
 * The DashboardTileOutline renders the shape of a dashboard layout inside an
 * SVG. Each tile in the dashboard is represented, with the selected tile and
 * highlighted tile getting a special outline. When certain user behaviors
 * happen (like dragging or resizing), the tile outlines will change and a
 * colored overlay could get drawn to give the user a better experience.
 */
function DashboardTileOutline({
  cellSize,
  dragging,
  editing,
  horizontalPadding,
  hoverTileId,
  layout,
  resizing,
  selectedTileId,
  verticalPadding,
  zoomLevel,
}: Props) {
  // NOTE(stephen): We need to draw the highlighted tiles last so that the
  // highlight boundaries are drawn on top of all other tile boundaries. SVG
  // does not have z-index, and it paints elements in the order that they are
  // drawn.
  const [
    unhighlightedTiles,
    highlightedTile,
    hoverHighlightedTile,
  ] = React.useMemo(() => {
    let hovered;
    let highlighted;
    const tiles = layout.filter(tile => {
      if (tile.i === selectedTileId) {
        highlighted = tile;
        return false;
      }
      if (tile.i === hoverTileId) {
        hovered = tile;
        return false;
      }

      return true;
    });
    return [tiles, highlighted, hovered];
  }, [selectedTileId, hoverTileId, layout]);

  function renderTileOutline(tile: ReactGridPosition) {
    const height = tile.h * cellSize;
    const width = tile.w * cellSize;
    const x1 = tile.x * cellSize;
    const y1 = tile.y * cellSize;
    const x2 = x1 + width;
    const y2 = y1 + height;
    const tileIsSelected = tile.i === selectedTileId;

    const className = classNames('gd-dashboard-tile-outline__tile', {
      'gd-dashboard-tile-outline__tile--hover':
        tile.i === hoverTileId && !tileIsSelected,
      'gd-dashboard-tile-outline__tile--selected': tileIsSelected,
    });

    // Draw the outline of the tile as separate lines so that if there is
    // overlap with another tile, the dashes will line up. We draw the
    // top/bottom lines first and then the left/right lines.
    // NOTE(stephen): Setting a dash offset ensures that no matter where a tile
    // is placed on the page, the dashes will line up with another tile's that
    // could overlap. The dash offset is computed as the difference between the
    // start of the tile in the grid first dash will start for that line. We
    // use 2 * DASH_SIZE since we need to include the size of the dash + the
    // size of the gap.
    return (
      <g className={className} key={tile.i}>
        <rect
          fill={getTileOverlayColor(tileIsSelected, dragging, resizing)}
          fillOpacity="0.04"
          height={height}
          stroke="transparent"
          width={width}
          x={x1}
          y={y1}
        />
        <path
          d={`M${x1} ${y1}h${width}M${x1} ${y1 + height}h${width}`}
          strokeDashoffset={x1 % (2 * DASH_SIZE)}
        />
        <path
          d={`M${x1} ${y1}v${height}M${x1 + width} ${y1}v${height}`}
          strokeDashoffset={y1 % (2 * DASH_SIZE)}
        />
        {tileIsSelected && (
          <>
            {renderResizeHandle(x1, y1 + height / 2 - 3)}
            {renderResizeHandle(x2, y1 + height / 2 - 3)}
            {renderResizeHandle(x1, y2)}
            {renderResizeHandle(x1 + width / 2 - 3, y2)}
            {renderResizeHandle(x2, y2)}
          </>
        )}
      </g>
    );
  }

  const className = classNames('gd-dashboard-tile-outline', {
    'gd-dashboard-tile-outline--editing': editing,
  });

  const dashedLineColor = resizing || dragging ? '#b3bac5' : '#dfe1e6';
  return (
    <svg className={className} height="100%" width="100%">
      <g
        fill="transparent"
        stroke={selectedTileId !== undefined ? dashedLineColor : 'transparent'}
        strokeDasharray={DASH_SIZE}
        strokeWidth="2"
        transform={`scale(${zoomLevel}) translate(${horizontalPadding}, ${verticalPadding})`}
      >
        {unhighlightedTiles.map(renderTileOutline)}
        {hoverHighlightedTile !== undefined &&
          !editing &&
          renderTileOutline(hoverHighlightedTile)}
        {highlightedTile !== undefined &&
          !editing &&
          renderTileOutline(highlightedTile)}
      </g>
    </svg>
  );
}

export default (React.memo(
  DashboardTileOutline,
): React.AbstractComponent<Props>);
