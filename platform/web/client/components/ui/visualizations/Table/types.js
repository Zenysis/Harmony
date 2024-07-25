// @flow
import * as Zen from 'lib/Zen';

export type SortDirectionMap = {
  ASC: 'ASC',
  DESC: 'DESC',
};

export type SortDirection = $Keys<SortDirectionMap>;
export type SortState = {
  sortColumns: Zen.Array<string>,
  sortDirectionMap: Zen.Map<SortDirection>,
};

type CellData = string | number | null;

export type ColumnSpec<RowData, ColData = void> = {
  alwaysSort?: boolean,
  cellDataGetter: ({
    columnData: ColData,
    dataKey: string,
    rowData: RowData,
  }) => CellData,
  columnData: ColData,
  dataKey: string,
  label: string,
  mergeCells?: boolean,
  rotateHeader?: boolean,
};

export type TableCellProps<RowData, ColData = void> = {
  cellData: CellData,
  columnData: ColData,
  dataKey: string,
  isMergedCell: boolean,
  rowData: RowData,
  rowIndex: number,
};

export type RowDivider = {
  color: string,
  thickness: number,
};
