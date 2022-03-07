// @flow
import * as React from 'react';
import invariant from 'invariant';

import type DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';

export default function usePagination(
  itemHolders: $ReadOnlyArray<DashboardItemHolder>,
  itemHolder: DashboardItemHolder,
  onFullscreenTileChange: string => void,
): [
  number, // currentPage
  number, // numPages
  () => void, // onNextClick
  () => void, // onPreviousClick
] {
  const currentPage = itemHolders.indexOf(itemHolder) + 1;
  invariant(
    currentPage !== -1,
    'The current fullscreen itemHolder should always be in the itemHolders array',
  );

  const numPages = itemHolders.length;
  const onChangePage = React.useCallback(
    (pageDelta: -1 | 1) => {
      // NOTE(stephen): Since `currentPage` is 1 indexed, we must subtract 1 to
      // get into a 0 indexed system. Also need to add the number of pages so that
      // we never get a negative page index.
      const newPageIdx = (numPages + currentPage + pageDelta - 1) % numPages;
      onFullscreenTileChange(itemHolders[newPageIdx].id());
    },
    [currentPage, itemHolders, onFullscreenTileChange, numPages],
  );

  const onNextClick = React.useCallback(() => onChangePage(1), [onChangePage]);
  const onPreviousClick = React.useCallback(() => onChangePage(-1), [
    onChangePage,
  ]);

  return [currentPage, numPages, onNextClick, onPreviousClick];
}
