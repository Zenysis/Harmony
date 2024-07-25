// @flow
import * as React from 'react';

import DividerTile from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/DividerTile';
import GISTile from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/GISTile';
import IFrameTile from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/IFrameTile';
import PlaceholderTile from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/PlaceholderTile';
import QueryTile from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/QueryTile';
import TextTile from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/TextTile';
import { noop } from 'util/util';
import type { DashboardItemType } from 'models/DashboardBuilderApp/DashboardItem/types';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type Props = {
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

  extractedFilterItems: $ReadOnlyArray<QueryFilterItem>,
  
  item: DashboardItemType,
  onHeightUpdate?: (rowCount: number) => void,
  onItemChange: DashboardItemType => void,
  onOpenEditView: () => void,
  presenting: boolean,

  /** The height that this tile should be drawn to before scaling is applied. */
  referenceHeight: number,

  /** The width that this tile should be drawn to before scaling is applied. */
  referenceWidth: number,

  zoomLevel: number,
};

/**
 * A convenience wrapper component around each type of dashboard tile to render
 * just the tile's contents.
 */
function TileContent({
  collapse,
  dashboardFilterItems,
  dashboardGroupingItems,
  extractedFilterItems,
  item,
  onItemChange,
  onOpenEditView,
  presenting,
  referenceHeight,
  referenceWidth,
  zoomLevel,
  onHeightUpdate = noop,
}: Props): React.Node {
  if (item.tag === 'QUERY_ITEM') {
    return (
      <QueryTile
        collapse={collapse}
        dashboardFilterItems={dashboardFilterItems}
        dashboardGroupingItems={dashboardGroupingItems}
        item={item}
        onHeightUpdate={onHeightUpdate}
        onItemChange={onItemChange}
        presenting={presenting}
        referenceHeight={referenceHeight}
        referenceWidth={referenceWidth}
        scaleFactor={zoomLevel}
      />
    );
  }
  if (item.tag === 'GIS_ITEM') {
    return (
      <GISTile
        dashboardFilterItems={dashboardFilterItems}
        item={item}
        onItemChange={onItemChange}
      />
    );
  }
  if (item.tag === 'IFRAME_ITEM') {
    return <IFrameTile item={item} />;
  }

  if (item.tag === 'PLACEHOLDER_ITEM') {
    return (
      <PlaceholderTile
        height={referenceHeight * zoomLevel}
        item={item}
        onButtonClick={onOpenEditView}
        width={referenceWidth * zoomLevel}
      />
    );
  }

  if (item.tag === 'TEXT_ITEM') {
    return (
      <TextTile
        extractedFilterItems={extractedFilterItems}
        item={item}
        onHeightUpdate={onHeightUpdate}
        onItemChange={onItemChange}
        scaleFactor={collapse ? 1 : zoomLevel}
      />
    );
  }

  if (item.tag === 'DIVIDER_ITEM') {
    return <DividerTile scaleFactor={zoomLevel} />;
  }

  (item.tag: 'SPACER_ITEM');
  // NOTE: We just want to return whitespace so null is fine
  return null;
}

export default (React.memo(TileContent): React.AbstractComponent<Props>);
