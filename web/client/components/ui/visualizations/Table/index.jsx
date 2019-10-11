// @flow
import * as React from 'react';
import classNames from 'classnames';
import {
  Column,
  SortIndicator,
  Table as VirtualizedTable,
} from 'react-virtualized';

import InputText from 'components/ui/InputText';
import PageSelector from 'components/ui/PageSelector';
import autobind from 'decorators/autobind';
import { updateSortFromEvent } from 'components/ui/visualizations/Table/util';

// TODO(stephen): Move this import to somewhere else.
import type { ChartSize } from 'components/visualizations/BumpChart/types';
import type {
  ColumnSpec,
  SortState,
  TableCellProps,
} from 'components/ui/visualizations/Table/types';
import type { StyleObject } from 'types/jsCore';

type Props<RowData, CellData, ColData = void> = {
  cellRenderer:
    | void
    | ((TableCellProps<RowData, CellData, ColData>) => React.Node),
  className: string,
  columnSpecs: $ReadOnlyArray<ColumnSpec<RowData, CellData, ColData>>,
  enablePagination: boolean,
  enableSearch: boolean,
  footerHeight: number,
  headerHeight: number,
  initialSearchText: string,
  onSearchTextChange: (searchText: string) => void,
  onSortChange: (newSortState: SortState) => void,
  rowHeight: number,
  rowStyle: void | StyleObject | (({ index: number }) => StyleObject | void),
  rows: $ReadOnlyArray<RowData>,
  sortState: $ReadOnly<SortState>,
} & ChartSize;

type PaginationState = {
  currentPage: number,
  pageCount: number,
  pageSize: number,
};

type State = $ReadOnly<PaginationState>;

const TEXT = t('ui.visualizations.Table');

function getRowClass({ index }: { index: number }): string {
  if (index < 0) {
    return 'ui-table-visualization__header';
  }
  return index % 2 === 0
    ? 'ui-table-visualization__row ui-table-visualization__row--even'
    : 'ui-table-visualization__row ui-table-visualization__row--odd';
}

// Calculate the available height for the table's rows, excluding header and
// footer.
function calculateTableBodyHeight<RowData, CellData, ColData>({
  enablePagination,
  enableSearch,
  footerHeight,
  headerHeight,
  height,
}: Props<RowData, CellData, ColData>): number {
  const actualFooterHeight =
    enablePagination || enableSearch ? footerHeight : 0;

  return Math.max(height - headerHeight - actualFooterHeight, 0);
}

export default class Table<
  RowData: { +[string]: mixed },
  CellData,
  ColData = void,
> extends React.PureComponent<Props<RowData, CellData, ColData>, State> {
  static defaultProps = {
    cellRenderer: undefined,
    className: '',
    enablePagination: false,
    enableSearch: true,
    footerHeight: 30,
    headerHeight: 30,
    initialSearchText: '',
    onSearchTextChange: () => undefined,
    onPageChange: () => undefined,
    rowHeight: 30,
    rowStyle: undefined,
  };

  state = {
    currentPage: 1,
    pageCount: 1,
    pageSize: 20,
  };

  // If the Table dimensions have changed, we must invalidate the current
  // pagination state to ensure the page size matches the number of rows that
  // can be displayed within the Table's dimensions.
  static getDerivedStateFromProps(
    nextProps: Props<CellData, ColData>,
    nextState: State,
  ): ?State {
    const { enablePagination, height, rowHeight, rows } = nextProps;
    const rowCount = rows.length;
    if (rowCount === 0 || height === 0) {
      return {
        currentPage: 1,
        pageCount: 1,
        pageSize: 20,
      };
    }

    // If pagination is disabled, we should show all rows on a single page.
    if (!enablePagination) {
      // If the enablePagination prop has stayed the same for multiple calls,
      // the page state should already be set to show all rows.
      if (nextState.pageSize === rowCount && nextState.currentPage === 1) {
        return null;
      }

      // With pagination disabled, only one page will be displayed containing
      // all rows.
      return {
        currentPage: 1,
        pageCount: 1,
        pageSize: rowCount,
      };
    }

    const bodyHeight = calculateTableBodyHeight(nextProps);
    const pageSize = Math.floor(bodyHeight / rowHeight);

    // If page size and count has not changed, we are safe to preserve the
    // current state.
    const pageCount = Math.ceil(rowCount / pageSize) || 1;
    if (pageSize === nextState.pageSize && pageCount === nextState.pageCount) {
      return null;
    }

    // If a change in data length or component height has changed the number of
    // possible pages, reset the current page to the first page. This is less
    // confusing to the user than trying to guess hich page they should be sent
    // to.
    return {
      currentPage: 1,
      pageCount,
      pageSize,
    };
  }

  getVisibleRowCount(): number {
    const { enablePagination, rows } = this.props;
    const fullRowCount = rows.length;

    // If pagination is disabled, we will be displaying all rows in the table.
    if (!enablePagination || fullRowCount === 0) {
      return fullRowCount;
    }

    // If the currently selected page is the last page in the range, return the
    // compute the exact number of results for that final page since it might be
    // different than pageSize (i.e. a partially filled page).
    const { currentPage, pageCount, pageSize } = this.state;
    if (currentPage === pageCount) {
      const leftover = fullRowCount % pageSize;
      if (leftover !== 0) {
        return leftover;
      }
    }

    return pageSize;
  }

  @autobind
  getRow({ index }: { index: number }): RowData {
    const { currentPage, pageSize } = this.state;
    const rowIndex = index + pageSize * (currentPage - 1);
    return this.props.rows[rowIndex];
  }

  @autobind
  onSortClick({ event, sortBy }: { event: MouseEvent, sortBy: string }) {
    const { sortColumns, sortDirectionMap } = this.props.sortState;
    this.props.onSortChange(
      updateSortFromEvent(event, sortBy, sortColumns, sortDirectionMap),
    );
  }

  @autobind
  onPageChange(newPage: number) {
    this.setState({ currentPage: newPage });
  }

  maybeRenderPagination() {
    if (!this.props.enablePagination) {
      return null;
    }

    const { currentPage, pageSize } = this.state;
    return (
      <PageSelector
        currentPage={currentPage}
        onPageChange={this.onPageChange}
        pageSize={pageSize}
        resultCount={this.props.rows.length}
      />
    );
  }

  maybeRenderSearchBox() {
    const { enableSearch, initialSearchText, onSearchTextChange } = this.props;
    if (!enableSearch) {
      return null;
    }

    return (
      <InputText.Uncontrolled
        className="ui-table-visualization__search-box hide-on-export"
        debounce
        debounceTimeoutMs={30}
        initialValue={initialSearchText}
        onChange={onSearchTextChange}
        placeholder={TEXT.searchPlaceholder}
      />
    );
  }

  maybeRenderTable() {
    const { headerHeight, rowHeight, rowStyle, width } = this.props;
    const height = calculateTableBodyHeight(this.props) + headerHeight;

    return (
      <VirtualizedTable
        className="ui-table-visualization__virtualized-table"
        width={width}
        height={height}
        headerHeight={headerHeight}
        noRowsRenderer={this.renderNoRowsMessage}
        rowHeight={rowHeight}
        rowClassName={getRowClass}
        rowCount={this.getVisibleRowCount()}
        rowGetter={this.getRow}
        sort={this.onSortClick}
        rowStyle={rowStyle}
      >
        {this.renderColumns()}
      </VirtualizedTable>
    );
  }

  maybeRenderFooter() {
    const { enablePagination, enableSearch, footerHeight } = this.props;
    if (!enablePagination && !enableSearch) {
      return null;
    }

    const style = { height: `${footerHeight}px` };
    return (
      <div className="ui-table-visualization__footer" style={style}>
        {this.maybeRenderSearchBox()}
        {this.maybeRenderPagination()}
      </div>
    );
  }

  @autobind
  renderHeaderItem({ dataKey, label }: ColumnSpec<RowData, CellData, ColData>) {
    const { sortColumns, sortDirectionMap } = this.props.sortState;
    const showSortIndicator = sortColumns.includes(dataKey);

    const cellClassName = classNames('ui-table-visualization__header-cell', {
      'ui-table-visualization__header-cell--sorted': showSortIndicator,
    });
    const sortIndicator = showSortIndicator ? (
      <SortIndicator sortDirection={sortDirectionMap.get(dataKey)} />
    ) : null;

    return (
      <React.Fragment>
        <span className={cellClassName} data-content={label}>
          {label}
        </span>
        {sortIndicator}
      </React.Fragment>
    );
  }

  @autobind
  renderTableCell(cellProps: TableCellProps<RowData, CellData, ColData>) {
    const { cellData, columnData, dataKey, rowData } = cellProps;
    const { cellRenderer } = this.props;
    if (cellRenderer === undefined) {
      return rowData[dataKey];
    }

    return cellRenderer({ cellData, columnData, dataKey, rowData });
  }

  renderColumns(): $ReadOnlyArray<React.Element<typeof Column>> {
    return this.props.columnSpecs.map(
      ({ label, columnData, dataKey, cellDataGetter }) => (
        <Column
          key={dataKey}
          headerRenderer={this.renderHeaderItem}
          flexGrow={1}
          width={20}
          cellRenderer={this.renderTableCell}
          label={label}
          dataKey={dataKey}
          cellDataGetter={cellDataGetter}
          columnData={columnData}
        />
      ),
    );
  }

  @autobind
  renderNoRowsMessage() {
    return <div className="ui-table-visualization__no-rows">{TEXT.noRows}</div>;
  }

  render() {
    const className = `${this.props.className} ui-table-visualization`;
    return (
      <div className={className}>
        {this.maybeRenderTable()}
        {this.maybeRenderFooter()}
      </div>
    );
  }
}
