// @flow
import type ZenArray from 'util/ZenModel/ZenArray';
import type ZenMap from 'util/ZenModel/ZenMap';

export type SortDirection = 'ASC' | 'DESC';
export type SortState = {
  sortColumns: ZenArray<string>,
  sortDirectionMap: ZenMap<SortDirection>,
};

export type ColumnSpec<RowData, CellData, ColData = void> = {
  label: string,
  dataKey: string,
  columnData: ColData,
  cellDataGetter: ({
    columnData: ColData,
    dataKey: string,
    rowData: RowData,
  }) => CellData,
};

export type TableCellProps<RowData, CellData, ColData = void> = {
  cellData: CellData,
  columnData: ColData,
  dataKey: string,
  rowData: RowData,
};
