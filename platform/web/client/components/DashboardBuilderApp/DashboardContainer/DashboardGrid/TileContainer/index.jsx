// @flow
import * as React from 'react';
import classNames from 'classnames';
import invariant from 'invariant';

import EditItemView from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/EditItemView';
import PlaceholderEditView from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/EditItemView/PlaceholderEditView';
import PlaceholderTileMenu from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/TileMenu/PlaceholderTileMenu';
import QueryTile from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/QueryTile';
import QueryTileMenu from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/TileMenu/QueryTileMenu';
import TileContent from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/TileContent';
import TileDragButton from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/TileDragButton';
import TileMenu from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/TileMenu';
import useBoolean from 'lib/hooks/useBoolean';
import { FULLSCREEN_TILE_TYPES } from 'components/DashboardBuilderApp/hooks/useFullscreenTileContext';
import type DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type Props = {
  activateTileDownloads: boolean,
  cellSize: number,
  cellsPerRow: number,
  collapse: boolean,
  /**
   * Dashboard-level filters to apply to this item. If the tile is a query tile
   * and the filters are empty, then the original query filters will be used.
   */
  dashboardFilterItems: $PropertyType<
    React.ElementConfig<typeof QueryTile>,
    'dashboardFilterItems',
  >,
  /**
   * Dashboard-level groupings to apply to this item. If the tile is a query
   * tile and the groupings are empty, then the original query groupings will be
   * used.
   */
  dashboardGroupingItems: $PropertyType<
    React.ElementConfig<typeof QueryTile>,
    'dashboardGroupingItems',
  >,

  /**
   * extracted filters to apply to the display custom values in
   * the text box
   */
  extractedFilterItems: $ReadOnlyArray<QueryFilterItem>,

  itemHolder: DashboardItemHolder,

  legacy: boolean,

  onChangeTile: DashboardItemHolder => void,
  onCloneTile: DashboardItemHolder => void,
  onDeleteTile: DashboardItemHolder => void,
  onEditingChange: boolean => void,
  onFullscreenTileChange: string => void,
  onHeightUpdate: (string, number) => void,
  overriddenRowCount?: number | void,
  padding: number,
  presenting: boolean,
  repositioningTiles: boolean,
  showTileButtons: boolean,
  zoomLevel: number,
};

/**
 * The TileContainer renders the data held by the DashboardItemHolder onto the
 * page. Depending on the type of the dashboard item held, the appropriate
 * experience will be shown (i.e. GIS, Placeholder, Query). The container also
 * stores the tile repositioning buttons (dragging, resizing) and dropdown menu
 * containing options (edit, clone, delete) for the current tile.
 */
function TileContainer({
  activateTileDownloads,
  cellSize,
  cellsPerRow,
  collapse,
  dashboardFilterItems,
  dashboardGroupingItems,
  extractedFilterItems,
  itemHolder,
  legacy,
  onChangeTile,
  onCloneTile,
  onDeleteTile,
  onEditingChange,
  onFullscreenTileChange,
  onHeightUpdate,
  overriddenRowCount,
  padding,
  presenting,
  repositioningTiles,
  showTileButtons,
  zoomLevel,
}: Props) {
  const item = itemHolder.item();
  const [editing, openEditView, closeEditView] = useBoolean(false);

  const onOpenTileFullscreenView = React.useCallback(() => {
    onFullscreenTileChange(itemHolder.id());
  }, [itemHolder, onFullscreenTileChange]);

  const onOpenEditView = React.useCallback(() => {
    openEditView();
    onEditingChange(true);
  }, [openEditView, onEditingChange]);

  const onCloseEditView = React.useCallback(() => {
    closeEditView();
    onEditingChange(false);
  }, [closeEditView, onEditingChange]);

  // All text tiles, dividers and spacers are borderless.
  const borderless = ['TEXT_ITEM', 'SPACER_ITEM', 'DIVIDER_ITEM'].includes(
    item.tag,
  );

  // NOTE: Applying the spacing directly to each dashboard item
  // ourselves instead of having react-grid-layout do it since the library does
  // not ensure the placeholder item (the blue box) when dragging is the full
  // non-padded width/height.
  const zoomAdjustedPadding = borderless ? 0 : padding * zoomLevel;
  const wrapperStyle = React.useMemo(
    () => ({
      height: '100%',
      padding: zoomAdjustedPadding,
    }),
    [zoomAdjustedPadding],
  );

  const onCloneItem = React.useCallback(() => onCloneTile(itemHolder), [
    itemHolder,
    onCloneTile,
  ]);

  const onDeleteItem = React.useCallback(() => onDeleteTile(itemHolder), [
    itemHolder,
    onDeleteTile,
  ]);

  const onItemChange = React.useCallback(
    newItem => onChangeTile(itemHolder.item(newItem)),
    [itemHolder, onChangeTile],
  );

  const onEditItemSave = React.useCallback(
    newItem => {
      onItemChange(newItem);
      onCloseEditView();
    },
    [onItemChange, onCloseEditView],
  );

  const onTileContentHeightUpdate = (height: number) =>
    onHeightUpdate(itemHolder.id(), Math.ceil(height / cellSize));

  const tileContainerId = itemHolder.id();
  const position = itemHolder.position();

  // NOTE: The referenceHeight and referenceWidth are the height and
  // width of the tile at a zoomLevel of 1.
  const referenceHeight =
    (overriddenRowCount || position.rowCount) * cellSize - padding * 2;
  const referenceWidth = position.columnCount * cellSize - padding * 2;

  function maybeRenderEditView() {
    if (!editing) {
      return null;
    }

    invariant(item.tag !== 'SPACER_ITEM', 'Spacer items cannot be edited');
    invariant(item.tag !== 'DIVIDER_ITEM', 'Divider items cannot be edited');

    // NOTE: Editing a placeholder item is a special case since
    // it will open up the ability to edit the true item type that the
    // placeholder represents
    if (item.tag === 'PLACEHOLDER_ITEM') {
      return (
        <PlaceholderEditView
          cellsPerRow={cellsPerRow}
          extractedFilterItems={extractedFilterItems}
          initialItem={item}
          legacy={legacy}
          onItemChange={onEditItemSave}
          onRequestClose={onCloseEditView}
          position={position}
          scaleFactor={collapse ? 1 : zoomLevel}
          tileContainerId={tileContainerId}
        />
      );
    }

    return (
      <EditItemView
        cellsPerRow={cellsPerRow}
        extractedFilterItems={extractedFilterItems}
        initialItem={item}
        legacy={legacy}
        onItemChange={onEditItemSave}
        onRequestClose={onCloseEditView}
        position={position}
        scaleFactor={collapse ? 1 : zoomLevel}
        tileContainerId={tileContainerId}
      />
    );
  }

  function renderTileMenu() {
    if (item.tag === 'QUERY_ITEM') {
      return (
        <QueryTileMenu
          activateTileDownloads={activateTileDownloads}
          dashboardFilterItems={dashboardFilterItems}
          dashboardGroupingItems={dashboardGroupingItems}
          item={item}
          legacy={legacy}
          onCloneItem={onCloneItem}
          onDeleteItem={onDeleteItem}
          onEditItem={onOpenEditView}
          onPlayItem={onOpenTileFullscreenView}
          presenting={presenting}
        />
      );
    }
    if (item.tag === 'PLACEHOLDER_ITEM') {
      return (
        <PlaceholderTileMenu
          item={item}
          legacy={legacy}
          onCloneItem={onCloneItem}
          onDeleteItem={onDeleteItem}
          onEditItem={onOpenEditView}
        />
      );
    }

    // Spacer and Divider items are not editable
    const onEditItem = ['SPACER_ITEM', 'DIVIDER_ITEM'].includes(item.tag)
      ? undefined
      : onOpenEditView;

    // We only pass an onPlayItem callback for items that can be shown in
    // fullscreen
    const onPlayItem = FULLSCREEN_TILE_TYPES.has(item.tag)
      ? onOpenTileFullscreenView
      : undefined;

    return (
      <TileMenu
        activateTileDownloads={activateTileDownloads}
        legacy={legacy}
        onCloneItem={onCloneItem}
        onDeleteItem={onDeleteItem}
        onEditItem={onEditItem}
        onPlayItem={onPlayItem}
        presenting={presenting}
      />
    );
  }

  const containerClassName = classNames('gd-dashboard-tile-container', {
    'gd-dashboard-tile-container--borderless': borderless,
    'gd-dashboard-tile-container--legacy': legacy,
    'gd-dashboard-tile-container--modern': !legacy,
  });

  function maybeRenderLegacyTileButtons() {
    if (!showTileButtons || !legacy) {
      return null;
    }
    return (
      <React.Fragment>
        <TileDragButton
          legacy
          presenting={presenting}
          repositioningTiles={repositioningTiles}
        />
        {renderTileMenu()}
      </React.Fragment>
    );
  }

  function maybeRenderTileButtons() {
    if (!showTileButtons || legacy || editing) {
      return null;
    }
    return (
      <div className="gd-dashboard-tile-container__button-wrapper">
        <TileDragButton
          presenting={presenting}
          repositioningTiles={repositioningTiles}
        />
        {renderTileMenu()}
      </div>
    );
  }

  function maybeRenderTileContent() {
    // Don't render tile content while we're editing - we don't want objects
    // from the view to interferece with the edit view.
    if (editing) {
      return null;
    }
    return (
      <TileContent
        collapse={collapse}
        dashboardFilterItems={dashboardFilterItems}
        dashboardGroupingItems={dashboardGroupingItems}
        extractedFilterItems={extractedFilterItems}
        item={item}
        onHeightUpdate={onTileContentHeightUpdate}
        onItemChange={onItemChange}
        onOpenEditView={onOpenEditView}
        presenting={presenting}
        referenceHeight={referenceHeight}
        referenceWidth={referenceWidth}
        zoomLevel={zoomLevel}
      />
    );
  }

  return (
    // NOTE: Adding the 'download-image-current-size' class so that
    // the ShareQueryModal can find the visualization component.
    // TODO: Lets change how this works so we don't have to do this.
    // NOTE: since we want the tile buttons to be aligned relative to
    // tile outline its easier to render them outside of the tile container class
    // this is because there are padding difference between the visualizations,
    // and other tile components.
    <div className="download-image-current-size" style={wrapperStyle}>
      {maybeRenderTileButtons()}
      <div className={containerClassName} id={tileContainerId}>
        {maybeRenderLegacyTileButtons()}
        {maybeRenderTileContent()}
        {maybeRenderEditView()}
      </div>
    </div>
  );
}

export default (React.memo(TileContainer): React.AbstractComponent<Props>);
