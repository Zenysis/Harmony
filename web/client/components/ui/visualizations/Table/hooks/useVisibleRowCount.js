// @flow
import * as React from 'react';

/** Provides a count of the visible rows of the current table page. */
export default function useVisibleRowCount(
  currentPage: number,
  enablePagination: boolean,
  pageCount: number,
  pageSize: number,
  rowCount: number,
): number {
  return React.useMemo(() => {
    // If pagination is disabled, we will be displaying all rows in the table.
    if (!enablePagination || rowCount === 0) {
      return rowCount;
    }

    // If the currently selected page is the last page in the range, return the
    // compute the exact number of results for that final page since it might be
    // different than pageSize (i.e. a partially filled page).
    if (currentPage === pageCount) {
      const leftover = pageSize === 0 ? 0 : rowCount % pageSize;
      if (leftover !== 0) {
        return leftover;
      }
    }

    return pageSize;
  }, [currentPage, enablePagination, pageCount, pageSize, rowCount]);
}
