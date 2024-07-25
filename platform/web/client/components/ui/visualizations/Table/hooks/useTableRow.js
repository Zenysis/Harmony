// @flow
import * as React from 'react';

/** Provides a `getTableRow` callback function */
export default function useTableRow<RowData>(
  currentPage: number,
  pageSize: number,
  rows: $ReadOnlyArray<RowData>,
): (index: number) => RowData {
  const getRow = React.useCallback(
    (index: number) => {
      const rowIndex = index + pageSize * (currentPage - 1);
      return rows[rowIndex];
    },
    [currentPage, pageSize, rows],
  );
  return getRow;
}
