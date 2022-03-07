// @flow
import * as React from 'react';

import usePrevious from 'lib/hooks/usePrevious';
import { difference } from 'util/setUtil';
import type DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';

function findNewTileId(
  currentTileIds: $ReadOnlySet<string>,
  prevTileIds: $ReadOnlySet<string>,
): string | void {
  const newlyAddedTileIds = difference(currentTileIds, prevTileIds);

  // NOTE(david): If there are multiple new tiles then we do not know which
  // one to scroll to. The only current case for this is using the undo button.
  // This should already be handled but adding this here just in case.
  if (newlyAddedTileIds.size !== 1) {
    return undefined;
  }

  return newlyAddedTileIds.values().next().value;
}

/**
 * When a new tile is added to a dashboard, it is scrolled into view. We do this
 * by comparing the current tiles to those from the previous render to identify
 * newly added tiles.
 */
export default function useScrollToNewTile(
  items: $ReadOnlyArray<DashboardItemHolder>,
  hasUnsavedChanges: boolean,
) {
  const tileIds = React.useMemo(() => new Set(items.map(item => item.id())), [
    items,
  ]);
  const prevTileIds = usePrevious(tileIds);

  // If the user has unsaved changes, we want to find out if a single new tile
  // has been added to the dashboard.
  const newTileId =
    hasUnsavedChanges && prevTileIds !== undefined
      ? findNewTileId(tileIds, prevTileIds)
      : undefined;

  React.useLayoutEffect(() => {
    if (newTileId === undefined) {
      return;
    }

    // If there is a single new tile then find it and scroll it into view.
    const tileElt = document.getElementById(newTileId);
    if (tileElt) {
      tileElt.scrollIntoView({ behavior: 'smooth' });
    }
  }, [newTileId]);
}
