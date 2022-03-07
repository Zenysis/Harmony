// @flow
import * as React from 'react';

import calculateTableBodyHeight from 'components/ui/visualizations/Table/calculateTableBodyHeight';

type PaginationState = {
  currentPage: number,
  pageCount: number,
  pageSize: number,
};

const INITIAL_STATE = {
  currentPage: 1,
  pageCount: 1,
  pageSize: 20,
};

/** Hook to manage table pagination */
export default function usePagination(
  enablePagination: boolean,
  headerHeight: number,
  rowCount: number,
  rowHeight: number,
  scrollbarHeight: number,
  tableHeight: number,
): [
  number, // currentPage
  number, // pageCount
  number, // pageSize
  (number) => void, // onCurrentPageChange
] {
  // NOTE(stephen): This hook must mutate its state in a *synchronous* way and
  // cannot use useState + useEffect for changes. This is because changes to the
  // `rowCount` happen synchronously. If we wait for an asynchronous update to
  // the `currentPage`, we could end up producing an invalid value for a short
  // amount of time until the asynchronous update completes.
  // Example: If the user's `currentPage` = 2 but `rowCount` changes to be 1,
  // then we need to update `currentPage = 1` immediately. If we were to call
  // the hypothetical `setCurrentPage(1)`, then the `currentPage` we would
  // return first is `2`, followed by a subsequent update to return `1` when the
  // `setState` call completes and flushes a new update.
  const paginationStateRef = React.useRef<PaginationState>(INITIAL_STATE);

  // NOTE(stephen): Since we aren't using a `useState`, when the user manually
  // triggers a change to a new page, we need to somehow trigger a rerender. If
  // we purely update the ref, then React will not rerender since it doesn't
  // monitor changes to refs. This `forceUpdate` callback is a simple state
  // change that just increments a value by 1.
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const onCurrentPageChange = React.useCallback(newPage => {
    paginationStateRef.current.currentPage = newPage;
    forceUpdate();
  }, []);

  React.useMemo(() => {
    // If no rows can be shown, return a default page setting.
    if (rowCount === 0 || tableHeight === 0) {
      paginationStateRef.current = INITIAL_STATE;
      return;
    }

    // If pagination is disabled then we display a single page with all the rows
    if (!enablePagination) {
      paginationStateRef.current = {
        currentPage: 1,
        pageCount: 1,
        pageSize: 1,
      };
      return;
    }

    const bodyHeight = calculateTableBodyHeight(tableHeight, headerHeight);
    const newPageSize = Math.floor((bodyHeight - scrollbarHeight) / rowHeight);

    // If page size and count has not changed, we are safe to preserve the
    // current state.
    const newPageCount = Math.ceil(rowCount / newPageSize) || 1;
    if (
      paginationStateRef.current.pageSize === newPageSize &&
      paginationStateRef.current.pageCount === newPageCount
    ) {
      return;
    }

    // If a change in data length or component height has changed the number
    // of possible pages, reset the current page to the first page. This is
    // less confusing to the user than trying to guess which page they should
    // be sent to.
    paginationStateRef.current = {
      currentPage: 1,
      pageCount: newPageCount,
      pageSize: newPageSize,
    };
  }, [
    enablePagination,
    headerHeight,
    rowCount,
    rowHeight,
    scrollbarHeight,
    tableHeight,
  ]);

  const { currentPage, pageCount, pageSize } = paginationStateRef.current;
  return [currentPage, pageCount, pageSize, onCurrentPageChange];
}
