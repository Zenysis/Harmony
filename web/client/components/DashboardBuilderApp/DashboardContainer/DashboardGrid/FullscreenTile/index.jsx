// @flow
import * as React from 'react';
import BaseModal from 'components/ui/BaseModal';
import classNames from 'classnames';
import invariant from 'invariant';

import FooterBar from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/FullscreenTile/FooterBar';
import QueryTile from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/QueryTile';
import Spacing from 'components/ui/Spacing';
import TileContent from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/TileContent';
import useFullscreenScaling from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/FullscreenTile/hooks/useFullscreenScaling';
import usePagination from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/FullscreenTile/hooks/usePagination';
import { PopoverContext } from 'components/ui/Popover/internal/PopoverContext';
import { noop } from 'util/util';
import type DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';
import type DashboardGISItem from 'models/DashboardBuilderApp/DashboardItem/DashboardGISItem';
import type DashboardIFrameItem from 'models/DashboardBuilderApp/DashboardItem/DashboardIFrameItem';
import type DashboardQueryItem from 'models/DashboardBuilderApp/DashboardItem/DashboardQueryItem';
import type DashboardTextItem from 'models/DashboardBuilderApp/DashboardItem/DashboardTextItem';

type Props = {
  cellSize: number,
  tilePadding: number,

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

  /** All the items that can be cycled through in the fullscreen view */
  itemHolders: $ReadOnlyArray<DashboardItemHolder>,

  /** The current fullscreen item */
  itemHolder: DashboardItemHolder,

  /**
   * A callback to be used to change a tile. This can happen in fullscreen mode
   * when interacting with a tile (e.g. sorting table columns)
   */
  onChangeTile: DashboardItemHolder => void,

  /** A callback for when the current fullscreen item changes */
  onFullscreenTileChange: string => void,

  /** A callback from when the fullscreen view is closed */
  onRequestClose: () => void,
};

// NOTE(david): All popovers that render on a fullscreen tile need to have the
// parent element set otherwise they will render behind the fullscreen overlay.
const POPOVER_CONTEXT = { parentElt: 'gd-fullscreen-tile' };

/**
 * The FullscreenTile component is a component that is used in the dashboard's
 * play mode to display an individual tile. It should only ever be displayed in
 * fullscreen.
 */
function FullscreenTile(
  {
    cellSize,
    tilePadding,
    dashboardFilterItems,
    dashboardGroupingItems,
    itemHolders,
    itemHolder,
    onChangeTile,
    onFullscreenTileChange,
    onRequestClose,
  }: Props,
  ref: $Ref<React.ElementRef<'div'>>,
) {
  const [currentPage, numPages, onNextClick, onPreviousClick] = usePagination(
    itemHolders,
    itemHolder,
    onFullscreenTileChange,
  );

  const [
    referenceHeight,
    referenceWidth,
    scaleFactor,
    tileContainerRef,
  ] = useFullscreenScaling(itemHolder.position(), cellSize, tilePadding);

  const onItemChange = React.useCallback(
    newItem => onChangeTile(itemHolder.item(newItem)),
    [itemHolder, onChangeTile],
  );

  return (
    <div className="gd-fullscreen-tile" id="gd-fullscreen-tile" ref={ref}>
      <PopoverContext.Provider value={POPOVER_CONTEXT}>
        <Spacing
          className="gd-fullscreen-tile__tile-container"
          marginTop="xxl"
          marginX="xxl"
          padding="xxl"
        >
          <div
            className="gd-fullscreen-tile__tile-content"
            ref={tileContainerRef}
          >
            <TileContent
              collapse={false}
              dashboardFilterItems={dashboardFilterItems}
              dashboardGroupingItems={dashboardGroupingItems}
              item={itemHolder.item()}
              onItemChange={onItemChange}
              onOpenEditView={noop}
              presenting
              referenceWidth={referenceWidth}
              referenceHeight={referenceHeight}
              zoomLevel={scaleFactor}
            />
          </div>
        </Spacing>
        <FooterBar
          currentPage={currentPage}
          numPages={numPages}
          onExitClick={onRequestClose}
          onNextClick={onNextClick}
          onPreviousClick={onPreviousClick}
        />
      </PopoverContext.Provider>
    </div>
  );
}

export default (React.forwardRef(FullscreenTile): React.AbstractComponent<
  Props,
  React.ElementRef<'div'>,
>);
