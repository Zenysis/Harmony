// @flow
import * as React from 'react';
import classNames from 'classnames';

import { noop } from 'util/util';
import type { ColumnSpec } from 'components/ui/visualizations/Table/types';
import type { DataRow } from 'models/visualizations/Table/types';
import type { StyleObject } from 'types/jsCore';

function _shouldMerge<RowData, ColData>(
  rowAData: DataRow | void,
  rowBData: DataRow | void,
  columnSpec: ColumnSpec<RowData, ColData>,
) {
  if (
    columnSpec.mergeCells &&
    rowAData !== undefined &&
    rowBData !== undefined &&
    rowAData[columnSpec.dataKey] === rowBData[columnSpec.dataKey]
  ) {
    return true;
  }

  return false;
}

type Props<RowData, ColData> = {
  columns: $ReadOnlyArray<ColumnSpec<RowData, ColData>>,
  getCellStyle: (
    index: number,
    columnSpec: ColumnSpec<RowData, ColData>,
    rowData: RowData,
    isMergedWithNextCell: boolean,
  ) => StyleObject | void,
  onRowClick: (rowData: RowData) => void,
  nextRowData: RowData | void,
  prevRowData: RowData | void,
  renderTableCell: (
    columnSpec: ColumnSpec<RowData, ColData>,
    rowData: RowData,
    rowIndex: number,
    isMergedCell: boolean,
  ) => React.Node,
  rowContentWrapper:
    | void
    | ((
        cellElements: React.Element<'div'>,
        rowData: DataRow,
        index: number,
      ) => React.MixedElement),
  rowData: RowData,
  
  /** 
   * The index of the row within the current page of the table.
   */
  rowIndex: number,
  style: StyleObject,
};

export default function Row<RowData: DataRow, ColData>({
  columns,
  getCellStyle,
  onRowClick,
  nextRowData,
  prevRowData,
  renderTableCell,
  rowContentWrapper,
  rowData,
  rowIndex,
  style,
}: Props<RowData, ColData>): React.MixedElement {
  const className = classNames('ui-table-visualization__row', {
    'ui-table-visualization__row--clickable': onRowClick !== noop,
  });

  const role = onRowClick === noop ? undefined : 'button';
  const rowElement = (
    // NOTE(david): We can safely disable lint as we will always pass a role
    // if an onClick interaction exists
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className={className}
      onClick={() => onRowClick(rowData)}
      role={role}
      style={style}
      data-testid="ui-table-viz-row"
    >
      {columns.map(spec => {
        const isMergedWithPreviousCell = _shouldMerge(
          prevRowData,
          rowData,
          spec,
        );
        const isMergedWithNextCell = _shouldMerge(rowData, nextRowData, spec);

        const cellWrapperStyle = getCellStyle(
          rowIndex,
          spec,
          rowData,
          isMergedWithNextCell,
        );

        return (
          <div
            className="ui-table-visualization__table-cell"
            key={spec.dataKey}
            data-testid="ui-table-viz-cell"
            style={cellWrapperStyle}
          >
            {!isMergedWithPreviousCell &&
              renderTableCell(spec, rowData, rowIndex, isMergedWithNextCell)}
          </div>
        );
      })}
    </div>
  );

  if (rowContentWrapper) {
    return rowContentWrapper(rowElement, rowData, rowIndex);
  }

  return rowElement;
}
