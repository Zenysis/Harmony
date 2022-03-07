// @flow
import * as React from 'react';
import invariant from 'invariant';

import useBoolean from 'lib/hooks/useBoolean';
import usePrevious from 'lib/hooks/usePrevious';
import { noop } from 'util/util';

import type DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';

export const FULLSCREEN_TILE_TYPES: Set<string> = new Set([
  'QUERY_ITEM',
  'GIS_ITEM',
  'IFRAME_ITEM',
]);

/**
 * A helper function for sorting the position of dashbaord items. We first sort
 * by their y position and if they are equal we sort by their x position.
 */
function compareItemHolderPositions(
  itemHolderA: DashboardItemHolder,
  itemHolderB: DashboardItemHolder,
): number {
  const positionA = itemHolderA.position();
  const positionB = itemHolderB.position();

  if (positionA.y !== positionB.y) {
    return positionA.y - positionB.y;
  }

  return positionA.x - positionB.x;
}

/**
 * Build a sorted list of item holders that can be shown in fullscreen mode
 */
function buildSortedFullscreenItemholders(
  itemHolders: $ReadOnlyArray<DashboardItemHolder>,
): $ReadOnlyArray<DashboardItemHolder> {
  return itemHolders
    .filter(itemHolder => FULLSCREEN_TILE_TYPES.has(itemHolder.item().tag))
    .sort(compareItemHolderPositions);
}

type FullscreenTileState = {
  closeFullscreenTile: () => void,
  fullscreenTileId: string | void,
  fullscreenTileRef: $ElementRefObject<'div'>,
  setFullscreenTileId: (string | void) => void,
  sortedFullscreenItems: $ReadOnlyArray<DashboardItemHolder>,
  startFullscreenPlayMode: () => void,
};

const defaultFullscreenTileState = {
  closeFullscreenTile: noop,
  fullscreenTileId: undefined,
  fullscreenTileRef: { current: null },
  setFullscreenTileId: noop,
  sortedFullscreenItems: [],
  startFullscreenPlayMode: noop,
};

export const FullscreenTileContext: React.Context<FullscreenTileState> = React.createContext(
  defaultFullscreenTileState,
);

/**
 * This hook manages the state needed to display tiles in fullscreen mode and
 * provides that state and various callbacks in the form of a context object
 */
export default function useFullscreenTileContext(
  itemHolders: $ReadOnlyArray<DashboardItemHolder>,
): FullscreenTileState {
  const fullscreenEnabled = document.fullscreenEnabled;
  const sortedFullscreenItems = React.useMemo(
    () => buildSortedFullscreenItemholders(itemHolders),
    [itemHolders],
  );

  const [fullscreenTileId, setFullscreenTileId] = React.useState<string | void>(
    undefined,
  );
  const prevFullscreenTileId = usePrevious(fullscreenTileId);

  const startFullscreenPlayMode = React.useCallback(() => {
    invariant(
      sortedFullscreenItems.length > 0,
      'There must be at least one item that can be shown in fullscreen to enter fullscreen mode.',
    );
    setFullscreenTileId(sortedFullscreenItems[0].id());
  }, [sortedFullscreenItems]);

  const closeFullscreenTile = React.useCallback(() => {
    setFullscreenTileId(undefined);
  });

  // A ref to be attached to the element that we want to make fullscreen.
  const fullscreenTileRef = React.useRef(null);

  // Enter/Exit fullscreen mode when the fullscreenTile state changes.
  React.useEffect(() => {
    if (
      fullscreenEnabled &&
      fullscreenTileId === undefined &&
      document.fullscreenElement !== null
    ) {
      document.exitFullscreen();
    } else if (
      fullscreenEnabled &&
      fullscreenTileId !== undefined &&
      prevFullscreenTileId === undefined &&
      fullscreenTileRef.current
    ) {
      fullscreenTileRef.current.requestFullscreen();
    }
  }, [fullscreenTileRef, fullscreenTileId]);

  return {
    closeFullscreenTile,
    fullscreenTileId,
    fullscreenTileRef,
    setFullscreenTileId,
    startFullscreenPlayMode,
    sortedFullscreenItems,
  };
}
