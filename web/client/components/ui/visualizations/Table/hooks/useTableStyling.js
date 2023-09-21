// @flow
import * as React from 'react';

import type {
  ColumnSpec,
  RowDivider,
} from 'components/ui/visualizations/Table/types';
import type { StyleObject } from 'types/jsCore';

/** Provides callback for styling individual rows and cells in the table */
export default function useTableStyling<RowData, ColData>(
  fitWidth: boolean,
  getCellWrapperStyle:
    | ((ColumnSpec<RowData, ColData>) => StyleObject | void)
    | void,
  getRowCellStyle:
    | ((rowData: RowData, index: number) => StyleObject | void)
    | void,
  maxColumnWidth: number,
  minColumnWidth: number,
  rowDivider: RowDivider | void,
  rowStyle: void | StyleObject | (number => StyleObject | void),
  visibleRowCount: number,
): [
  (
    index: number,
    columnSpec: ColumnSpec<RowData, ColData>,
    rowData: RowData,
    isMergedWithNextCell: boolean,
  ) => StyleObject | void, // getCellStyle
  (number) => StyleObject | void, // getRowStyle
] {
  const getRowStyle = React.useCallback(
    (index: number) => {
      return typeof rowStyle === 'function' ? rowStyle(index) : rowStyle;
    },
    [rowStyle],
  );

  const getCellStyle = React.useCallback(
    (
      rowIndex: number,
      columnSpec: ColumnSpec<RowData, ColData>,
      rowData: RowData,
      isMergedWithNextCell: boolean,
    ) => {
      const isLastRowOfPage = rowIndex === visibleRowCount - 1;

      let cellWrapperStyle;

      if (!fitWidth) {
        cellWrapperStyle = {
          maxWidth: maxColumnWidth,
          minWidth: minColumnWidth,
        };
      }

      if (
        !isMergedWithNextCell &&
        !isLastRowOfPage &&
        rowDivider !== undefined
      ) {
        cellWrapperStyle = {
          ...cellWrapperStyle,
          borderBottom: `${rowDivider.thickness}px solid ${rowDivider.color}`,
        };
      }

      const rowCellStyle =
        getRowCellStyle !== undefined
          ? getRowCellStyle(rowData, rowIndex)
          : undefined;

      if (rowCellStyle !== undefined) {
        cellWrapperStyle = {
          ...cellWrapperStyle,
          ...rowCellStyle,
        };
      }

      const customCellWrapperStyle =
        getCellWrapperStyle !== undefined
          ? getCellWrapperStyle(columnSpec)
          : undefined;

      if (customCellWrapperStyle !== undefined) {
        cellWrapperStyle = {
          ...cellWrapperStyle,
          ...customCellWrapperStyle,
        };
      }

      return cellWrapperStyle;
    },
    [
      fitWidth,
      getCellWrapperStyle,
      getRowCellStyle,
      maxColumnWidth,
      minColumnWidth,
      rowDivider,
      visibleRowCount,
    ],
  );

  return [getCellStyle, getRowStyle];
}
