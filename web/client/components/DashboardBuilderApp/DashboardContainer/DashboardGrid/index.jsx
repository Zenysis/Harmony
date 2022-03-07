// @flow
import * as React from 'react';
import LazyLoad from 'react-lazyload';
import ReactGridLayout from 'react-grid-layout';
import classNames from 'classnames';

import DashboardTileOutline from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/DashboardTileOutline';
import FullscreenTile from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/FullscreenTile';
import GridBackground from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/GridBackground';
import Icon from 'components/ui/Icon';
import TileContainer from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer';
import useLayout from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/hooks/useLayout';
import useLayoutChange from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/hooks/useLayoutChange';
import useTileInteractions from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/hooks/useTileInteractions';
import { FullscreenTileContext } from 'components/DashboardBuilderApp/hooks/useFullscreenTileContext';
import { TILE_DRAG_HANDLE_CLASS } from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/TileDragButton';
import type DashboardCommonSettings from 'models/DashboardBuilderApp/DashboardCommonSettings';
import type DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

const SINGLE_RESIZE_HANDLE = ['se'];
const MULTIPLE_RESIZE_HANDLES = ['s', 'w', 'e', 'sw', 'se'];

type Props = {
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

  collapse: boolean,

  /** The number of large columns that structure the layout of the page. */
  columnCount: number,
  commonSettings: DashboardCommonSettings,

  /**
   * If set, the GridBackground will not be rendered and the tiles will be drawn
   * with nothing underneath them.
   */
  disableGridBackground?: boolean,

  /**
   * The padding, in pixels, between the left and right edges of the
   * DashboardGrid and the first/last cell in a row that a dashboard tile can be
   * placed in.
   */
  horizontalPadding: number,

  /**
   * The items that will be rendered in the dashboard grid. They should be
   * sorted by location on the grid: top-left to bottom-right.
   */
  items: $ReadOnlyArray<DashboardItemHolder>,

  /**
   * Whether the dashboard tiles should be lazyloaded and only perform their
   * initialization when the tile is in the user's viewport.
   */
  lazyload?: boolean,

  /** Whether or not we are using the legacy dashboard layout system */
  legacy: boolean,
  onChangeTile: DashboardItemHolder => void,
  onCloneTile: DashboardItemHolder => void,
  onDeleteTile: DashboardItemHolder => void,
  onItemsChange: ($ReadOnlyArray<DashboardItemHolder>) => void,
  presenting: boolean,

  /**
   * The padding, in pixels, around the outside of a tile that will prevent it
   * from directly touching any neighboring tiles.
   */
  tilePadding: number,

  /**
   * The padding, in pixels, between the top and bottom edges of the
   * DashboardGrid and the first/last cell in a column that a dashboard tile can
   * be placed in.
   */
  verticalPadding: number,

  /**
   * The current zoom level selected by the user. The zoom level unit is a
   * percentage scale factor, where 0.5 indicates 50% scaling (the user would
   * see a dashboard that is 50% smaller than normal), and a zoom level of 1.0
   * indicates the dashboard will be shown at 100% scale.
   */
  zoomLevel: number,
};

// Margin between items [x, y] in px.
// NOTE(stephen): Setting this to 0,0 since we apply our own padding between
// items through CSS. Still need to set a default margin, though, since
// react-grid-layout will default to 10,10
const DASHBOARD_ITEM_MARGIN = [0, 0];

const EMPTY_ARRAY = [];

function getAppliedFiltersAndGroupingsForTile(
  commonSettings: DashboardCommonSettings,
  itemHolder: DashboardItemHolder,
): [$ReadOnlyArray<QueryFilterItem>, $ReadOnlyArray<GroupingItem>] {
  const item = itemHolder.item();
  const id = itemHolder.id();

  // We can only filter a query or GIS tile. All other tiles don't receive
  // filters.
  const filterSettings = commonSettings.filterSettings();
  let filterItems = EMPTY_ARRAY;
  if (
    (item.tag === 'QUERY_ITEM' || item.tag === 'GIS_ITEM') &&
    !filterSettings.excludedTiles.includes(id)
  ) {
    filterItems = filterSettings.items;
  }

  // We can only apply groupings to a query tile.
  const groupingSettings = commonSettings.groupingSettings();
  let groupingItems = EMPTY_ARRAY;
  if (
    item.tag === 'QUERY_ITEM' &&
    !groupingSettings.excludedTiles.includes(id)
  ) {
    groupingItems = groupingSettings.items;
  }

  return [filterItems, groupingItems];
}

/**
 * The DashboardGrid renders all dashboard tiles within a grid layout. It uses
 * ReactGridLayout underneath to support dragging and resizing of tiles within
 * the page.
 */
function DashboardGrid({
  cellSize,
  cellsPerColumn,
  collapse,
  columnCount,
  commonSettings,
  disableGridBackground = false,
  horizontalPadding,
  items,
  lazyload = false,
  legacy,
  onChangeTile,
  onCloneTile,
  onDeleteTile,
  onItemsChange,
  presenting,
  tilePadding,
  verticalPadding,
  zoomLevel,
}: Props) {
  const cellsPerRow = cellsPerColumn * columnCount;
  const reactGridWidth = cellSize * cellsPerRow * zoomLevel;

  const [
    selectedTileId,
    hoverTileId,
    isDraggingTile,
    isEditingTile,
    isResizingTile,
    onTileClick,
    onEditingChange,
    onHoverStart,
    onHoverStop,
    repositionedLayout,
    reactGridLayoutEventProps,
  ] = useTileInteractions();

  // Scale the content padding by the zoom level so that the proportions match
  // the desired size after zooming. The padding is only applied to the content
  // and not to the outer element because the background needs to draw without
  // any padding.
  const contentStyle = React.useMemo(
    () => ({
      padding: `${verticalPadding * zoomLevel}px ${horizontalPadding *
        zoomLevel}px`,
    }),
    [horizontalPadding, verticalPadding, zoomLevel],
  );

  const containerWidth = reactGridWidth + horizontalPadding * 2 * zoomLevel;
  const containerStyle = React.useMemo(
    () => ({
      // Explicitly set the grid column size instead of `width` since this
      // allows the grid to align properly inside the parent when spacing is
      // applied around the element. It also helps ensure scrolling works
      // properly and is not offset weirdly from the left.
      gridTemplateColumns: !legacy ? containerWidth : undefined,

      // NOTE(stephen): In legacy mode, we set a max-width instead of using the
      // grid-templateSetting a max width since the container is being flexed
      // to fill the entire available space. Preferring `max-width` over `width`
      // because `width` messes with the parent's ability to compute the zoom
      // level to use in legacy mode.
      maxWidth: legacy ? containerWidth : undefined,
    }),
    [containerWidth, legacy],
  );

  const onGridLayoutChange = useLayoutChange(
    items,
    onItemsChange,
    collapse,
    cellSize,
    legacy,
  );

  const repositioningTiles = isDraggingTile || isResizingTile;
  const editing = !collapse && !presenting;

  // If we are not in present or collapse mode, then only the selected tile
  // should have buttons shown. In legacy mode, the hover tile should have them
  // shown.
  let tileWithVisibleButtons;
  if (editing && !repositioningTiles) {
    tileWithVisibleButtons = legacy ? hoverTileId : selectedTileId;
  }

  const {
    closeFullscreenTile,
    fullscreenTileId,
    fullscreenTileRef,
    setFullscreenTileId,
    sortedFullscreenItems: fullscreenItems,
  } = React.useContext(FullscreenTileContext);

  // NOTE(stephen): ReactGridLayout recommends memoizing the children array so
  // that rerenders are faster.
  // https://github.com/react-grid-layout/react-grid-layout#performance
  const tiles = React.useMemo(
    () =>
      items.map(item => {
        const id = item.id();

        const [
          filterItems,
          groupingItems,
        ] = getAppliedFiltersAndGroupingsForTile(commonSettings, item);

        const wrapperClassName = classNames('gd-dashboard-grid__tile-wrapper', {
          'gd-dashboard-grid__tile-wrapper--editing-tile':
            isEditingTile && !legacy,
          'gd-dashboard-grid__tile-wrapper--resizing':
            isResizingTile && !legacy,
          'gd-dashboard-grid__tile-wrapper--selected': selectedTileId === id,
        });

        const tileContainer = (
          <TileContainer
            cellSize={cellSize}
            cellsPerRow={cellsPerRow}
            collapse={collapse}
            dashboardFilterItems={filterItems}
            dashboardGroupingItems={groupingItems}
            itemHolder={item}
            legacy={legacy}
            onChangeTile={onChangeTile}
            onCloneTile={onCloneTile}
            onDeleteTile={onDeleteTile}
            onEditingChange={onEditingChange}
            onFullscreenTileChange={setFullscreenTileId}
            padding={tilePadding}
            presenting={presenting}
            repositioningTiles={repositioningTiles}
            showTileButtons={id === tileWithVisibleButtons}
            zoomLevel={zoomLevel}
          />
        );

        const children = lazyload ? (
          <LazyLoad height="100%" once overflow>
            {tileContainer}
          </LazyLoad>
        ) : (
          tileContainer
        );

        return (
          <div
            key={id}
            className={wrapperClassName}
            id={id}
            onClick={e => onTileClick(id, e)}
            onMouseEnter={() => onHoverStart(id)}
            onMouseLeave={() => onHoverStop()}
            role="button"
          >
            {children}
          </div>
        );
      }),
    [
      cellSize,
      cellsPerRow,
      collapse,
      commonSettings,
      isEditingTile,
      isResizingTile,
      items,
      lazyload,
      legacy,
      onChangeTile,
      onCloneTile,
      onDeleteTile,
      onEditingChange,
      onHoverStart,
      onHoverStop,
      onTileClick,
      presenting,
      repositioningTiles,
      selectedTileId,
      setFullscreenTileId,
      tilePadding,
      tileWithVisibleButtons,
      zoomLevel,
    ],
  );

  // NOTE(stephen): Must wrap the handle in an element because the resize icon
  // type is an SVG which does not respond to drag events. Preferring to memoize
  // it to try and preserve the pure-ness of the ReactGridLayout props.
  const scaledTilePadding = tilePadding * zoomLevel;
  const resizeHandle = React.useMemo(
    () => (
      <div
        className="gd-dashboard-grid__resize-handle"
        style={{
          bottom: scaledTilePadding,
          right: scaledTilePadding,
        }}
      >
        <Icon type="svg-resize" />
      </div>
    ),
    [scaledTilePadding],
  );

  // NOTE(david): It would be nice to define the position of each tile
  // individually. ReactGridLayout provides a way to do this through the
  // data-grid attribute but we were seeing some bugs with tiles sometimes not
  // being repositioned correctly (e.g. when using the undo button).
  const layout = useLayout(
    items,
    collapse,
    cellSize,
    columnCount * cellsPerColumn,
    tilePadding,
    reactGridWidth,
    legacy,
  );

  const resizeHandleLocations = legacy
    ? SINGLE_RESIZE_HANDLE
    : MULTIPLE_RESIZE_HANDLES;

  const gridClassname = classNames('gd-dashboard-grid', {
    'gd-dashboard-grid--editing-tile': isEditingTile && !legacy,
  });

  function maybeRenderFullscreenTile() {
    const fullscreenTile = items.find(item => item.id() === fullscreenTileId);
    if (fullscreenTile === undefined) {
      return null;
    }

    const [filterItems, groupingItems] = getAppliedFiltersAndGroupingsForTile(
      commonSettings,
      fullscreenTile,
    );
    return (
      <FullscreenTile
        ref={fullscreenTileRef}
        cellSize={cellSize}
        dashboardFilterItems={filterItems}
        dashboardGroupingItems={groupingItems}
        itemHolder={fullscreenTile}
        itemHolders={fullscreenItems}
        onChangeTile={onChangeTile}
        onFullscreenTileChange={setFullscreenTileId}
        onRequestClose={closeFullscreenTile}
        tilePadding={tilePadding}
      />
    );
  }

  // NOTE(stephen): Legacy dashboards do not use vertical compacting. Modern
  // dashboards *always* use vertical compacting.
  return (
    <React.Fragment>
      <div className={gridClassname} id="grid-layout" style={containerStyle}>
        {!collapse && !disableGridBackground && (
          <GridBackground
            cellSize={cellSize}
            cellsPerColumn={cellsPerColumn}
            columnCount={columnCount}
            horizontalPadding={horizontalPadding}
            repositioningTiles={repositioningTiles}
            showGridlines={editing && (legacy || repositioningTiles)}
            verticalPadding={verticalPadding}
            zoomLevel={zoomLevel}
          />
        )}
        {editing && !legacy && (
          <DashboardTileOutline
            cellSize={cellSize}
            dragging={isDraggingTile}
            editing={isEditingTile}
            horizontalPadding={horizontalPadding}
            hoverTileId={hoverTileId}
            layout={repositionedLayout || layout}
            resizing={isResizingTile}
            selectedTileId={selectedTileId}
            verticalPadding={verticalPadding}
            zoomLevel={zoomLevel}
          />
        )}
        <div className="gd-dashboard-grid__grid-layout" style={contentStyle}>
          <ReactGridLayout
            cols={cellsPerRow}
            compactType={collapse || !legacy ? 'vertical' : null}
            draggableCancel=".react-grid-draggable-cancel,input"
            draggableHandle={`.${TILE_DRAG_HANDLE_CLASS}`}
            isDraggable={editing}
            isResizable={editing}
            layout={layout}
            margin={DASHBOARD_ITEM_MARGIN}
            onLayoutChange={onGridLayoutChange}
            preventCollision={legacy}
            resizeHandle={legacy ? resizeHandle : undefined}
            resizeHandles={resizeHandleLocations}
            rowHeight={cellSize * zoomLevel}
            width={reactGridWidth}
            {...reactGridLayoutEventProps}
          >
            {tiles}
          </ReactGridLayout>
        </div>
      </div>
      {maybeRenderFullscreenTile()}
    </React.Fragment>
  );
}

export default (React.memo(DashboardGrid): React.AbstractComponent<Props>);
