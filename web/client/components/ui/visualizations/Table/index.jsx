// @flow
import * as React from 'react';

import Columns from 'components/ui/visualizations/Table/internal/Columns';
import Footer from 'components/ui/visualizations/Table/internal/Footer';
import Row from 'components/ui/visualizations/Table/internal/Row';
import calculateTableBodyHeight from 'components/ui/visualizations/Table/calculateTableBodyHeight';
import normalizeARIAName from 'components/ui/util/normalizeARIAName';
import usePagination from 'components/ui/visualizations/Table/hooks/usePagination';
import useTableRow from 'components/ui/visualizations/Table/hooks/useTableRow';
import useTableSort from 'components/ui/visualizations/Table/hooks/useTableSort';
import useTableStyling from 'components/ui/visualizations/Table/hooks/useTableStyling';
import useVisibleRowCount from 'components/ui/visualizations/Table/hooks/useVisibleRowCount';
import { noop } from 'util/util';
import type {
  ColumnSpec,
  RowDivider,
  SortState,
  TableCellProps,
} from 'components/ui/visualizations/Table/types';
import type { DataRow } from 'models/visualizations/Table/types';
import type { StyleObject } from 'types/jsCore';

type Props<RowData, ColData> = {
  columnSpecs: $ReadOnlyArray<ColumnSpec<RowData, ColData>>,
  height: number,
  rows: $ReadOnlyArray<RowData>,
  sortState: $ReadOnly<SortState>,
  width: number,
  wrapColumnTitles: boolean,

  /** The accessibility name for this table. Defaults to 'Table'. */
  ariaName?: string,

  /** Optional method to render the contents of a cell */
  cellRenderer?: void | ((TableCellProps<RowData, ColData>) => React.Node),
  enablePagination?: boolean,
  fitWidth?: boolean,

  /**
   * Whether or not to show a search box below the table. The actual search
   * filtering is owned by the parent component using the onSearchTextChange
   * and rows props.
   */
  enableSearch?: boolean,

  /** Get the style for a worksheet cell wrapper */
  getCellWrapperStyle?:
    | ((ColumnSpec<RowData, ColData>) => StyleObject | void)
    | void,

  /** Get the style for a header cell */
  getHeaderCellStyle?:
    | ((ColumnSpec<RowData, ColData>) => StyleObject | void)
    | void,

  /**
   * Get the style for a cell in the table body. This does not include header
   * cells.
   */
  getRowCellStyle?:
    | ((rowData: RowData, index: number) => StyleObject | void)
    | void,
  headerRowStyle?: StyleObject,
  initialSearchText?: string,
  maxColumnWidth?: number,
  minColumnWidth?: number,
  minHeaderHeight?: number,
  onRowClick?: (rowData: RowData) => void,
  onSearchTextChange?: (searchText: string) => void,
  onSortChange?: (newSortState: SortState) => void,

  /**
   * If set, this function will return an element with which to wrap
   * the contents of the row. The element you return must be the same height
   * as the `rowHeight` prop otherwise the table's layout will be messed up.
   * @param {React$Element.div} rowElement The row element to wrap. You
   * shouldn't do anything with this other than pass it down as the child
   * of the element returned by this function.
   * @param {DataRow} rowData The row's data
   * @returns {React$MixedElement} The wrapped row element
   */
  rowContentWrapper?:
    | void
    | ((
        cellElements: React.Element<'div'>,
        rowData: DataRow,
        index: number,
      ) => React.MixedElement),

  rowDivider?: RowDivider | void,
  rowHeight?: number,
  rowStyle?: void | StyleObject | (number => StyleObject | void),
  tableClassName?: string,
  tableContentsStyle?: StyleObject | void,
  ...
};

const TEXT = t('ui.visualizations.Table');

// TODO(stephen): This component was originally built around the constructs and
// requirements of `react-virtualized`'s Table implementation. This is why many
// of the callbacks operate the way they do: the virtualized table would make a
// callback for each cell with the correct data. On 2020-06-02, we refactored
// the table to use the newer and more lightweight `react-window`
// implementation. All the styles that react-virtualized Table provided to us
// were migrated to our internal code, so there is no change in look. However,
// the structure of this component is a bit convoluted to someone coming in to
// use it. Refactor it to be cleaner and more straightforward to use.
export default function Table<RowData: DataRow, ColData = void>({
  columnSpecs,
  height,
  rows,
  sortState,
  width,
  wrapColumnTitles,
  ariaName = TEXT.title,
  cellRenderer = undefined,
  enablePagination = false,
  enableSearch = true,
  fitWidth = true,
  getCellWrapperStyle = undefined,
  getHeaderCellStyle = undefined,
  getRowCellStyle = undefined,
  headerRowStyle = undefined,
  initialSearchText = '',
  maxColumnWidth = 500,
  minColumnWidth = 150,
  minHeaderHeight = 30,
  onRowClick = noop,
  onSearchTextChange = noop,
  onSortChange = noop,
  rowContentWrapper = undefined,
  rowDivider = {
    color: '#d9d9d9',
    thickness: 1,
  },
  rowHeight = 30,
  rowStyle = undefined,
  tableClassName = '',
  tableContentsStyle = undefined,
}: Props<RowData, ColData>): React.Node {
  const [headerHeight, setHeaderHeight] = React.useState(minHeaderHeight);
  const [scrollbarHeight, setScrollbarHeight] = React.useState(0);

  const rowCount = rows.length;

  const [currentPage, pageCount, pageSize, setCurrentPage] = usePagination(
    enablePagination,
    headerHeight,
    rowCount,
    rowHeight,
    scrollbarHeight,
    height,
  );

  const visibleRowCount = useVisibleRowCount(
    currentPage,
    enablePagination,
    pageCount,
    pageSize,
    rowCount,
  );

  const [getCellStyle, getRowStyle] = useTableStyling(
    fitWidth,
    getCellWrapperStyle,
    getRowCellStyle,
    maxColumnWidth,
    minColumnWidth,
    rowDivider,
    rowStyle,
    visibleRowCount,
  );

  const onSortClick = useTableSort(columnSpecs, onSortChange, sortState);

  const getRow = useTableRow(currentPage, pageSize, rows);

  const renderTableCell = React.useCallback(
    (
      columnSpec: ColumnSpec<RowData, ColData>,
      rowData: RowData,
      rowIndex: number,
      isMergedCell: boolean,
    ) => {
      const { cellDataGetter, columnData, dataKey } = columnSpec;

      const cellData = cellDataGetter({ columnData, dataKey, rowData });

      if (cellRenderer === undefined) {
        return cellData;
      }

      return cellRenderer({
        cellData,
        columnData,
        dataKey,
        isMergedCell,
        rowData,
        rowIndex,
      });
    },
    [cellRenderer],
  );

  const renderTableRow = React.useCallback(
    ({ index, style }) => {
      const rowData = getRow(index);
      const prevRowData = index > 0 ? getRow(index - 1) : undefined;
      const nextRowData =
        index < rows.length - 1 ? getRow(index + 1) : undefined;

      const fullStyle = { ...style, ...getRowStyle(index) };

      return (
        <Row
          columns={columnSpecs}
          getCellStyle={getCellStyle}
          style={fullStyle}
          onRowClick={onRowClick}
          nextRowData={nextRowData}
          prevRowData={prevRowData}
          renderTableCell={renderTableCell}
          rowContentWrapper={rowContentWrapper}
          rowData={rowData}
          rowIndex={index}
        />
      );
    },
    [
      columnSpecs,
      getCellStyle,
      getRow,
      getRowStyle,
      onRowClick,
      renderTableCell,
      rowContentWrapper,
      rows,
    ],
  );

  const bodyHeight = calculateTableBodyHeight(height, headerHeight);

  return (
    <div className="ui-table-visualization" style={{ height }}>
      <div className="ui-table-visualization__table-wrapper">
        <div
          role="table"
          aria-label={normalizeARIAName(ariaName)}
          className={`${tableClassName} ui-table-visualization__table`}
          style={tableContentsStyle}
        >
          <Columns
            bodyHeight={bodyHeight}
            columnSpecs={columnSpecs}
            enablePagination={enablePagination}
            fitWidth={fitWidth}
            getHeaderCellStyle={getHeaderCellStyle}
            maxColumnWidth={maxColumnWidth}
            minColumnWidth={minColumnWidth}
            minHeaderHeight={minHeaderHeight}
            onHeaderHeightUpdate={setHeaderHeight}
            onScrollbarHeightUpdate={setScrollbarHeight}
            onSortClick={onSortClick}
            renderTableRow={renderTableRow}
            rowHeight={rowHeight}
            scrollbarHeight={scrollbarHeight}
            sortState={sortState}
            headerRowStyle={headerRowStyle}
            width={width}
            wrapColumnTitles={wrapColumnTitles}
            visibleRowCount={visibleRowCount}
          />
        </div>
        {visibleRowCount === 0 && (
          <div className="ui-table-visualization__no-rows">{TEXT.noRows}</div>
        )}
      </div>
      {(enablePagination || enableSearch) && (
        <Footer
          currentPage={currentPage}
          enablePagination={enablePagination}
          enableSearch={enableSearch}
          initialSearchText={initialSearchText}
          onPageChange={setCurrentPage}
          onSearchTextChange={onSearchTextChange}
          pageSize={pageSize}
          resultCount={rows.length}
        />
      )}
    </div>
  );
}
