// @flow
import * as React from 'react';

import { updateSortFromEvent } from 'components/ui/visualizations/Table/sorting';
import type {
  ColumnSpec,
  SortState,
} from 'components/ui/visualizations/Table/types';

/** Provides an onSortClick callback function */
export default function useTableSort<RowData, ColData>(
  columnSpecs: $ReadOnlyArray<ColumnSpec<RowData, ColData>>,
  onSortChange: (newSortState: SortState) => void,
  sortState: $ReadOnly<SortState>,
): (sortBy: string, event: MouseEvent) => void {
  const onSortClick = React.useCallback(
    (sortBy: string, event: MouseEvent) => {
      const { sortColumns, sortDirectionMap } = sortState;
      const mandatorySortColumns = [];
      columnSpecs.forEach(({ alwaysSort, dataKey }) => {
        if (alwaysSort) {
          mandatorySortColumns.push(dataKey);
        }
      });

      onSortChange(
        updateSortFromEvent(
          event,
          sortBy,
          sortColumns,
          sortDirectionMap,
          mandatorySortColumns,
        ),
      );
    },
    [columnSpecs, onSortChange, sortState],
  );

  return onSortClick;
}
