// @flow
import * as React from 'react';
import classNames from 'classnames';
import invariant from 'invariant';

import InputText from 'components/ui/InputText';
import PageSelector from 'components/ui/PageSelector';
import TableCell from 'components/ui/Table/TableCell';
import TableHeaderCell from 'components/ui/Table/internal/TableHeaderCell';
import TableRow from 'components/ui/Table/TableRow';
import TableRowWrapper from 'components/ui/Table/internal/TableRowWrapper';
import TableSortUtil from 'components/ui/Table/internal/TableSortUtil';
import autobind from 'decorators/autobind';
import memoizeOne from 'decorators/memoizeOne';
import { uniqueId } from 'util/util';
import type { StyleObject } from 'types/jsCore';

const TEXT = t('ui.Table');

export type SortDirection = 'ASC' | 'DESC';

export type TableHeader<RowData> = $ReadOnly<{
  id: string,
  centerHeader?: boolean,
  displayContent?: React.Node,
  headerClassName?: string,
  searchable?: (row: RowData) => ?string,
  secondarySortKeys?: $ReadOnlyArray<string>,
  sortFn?: (row1: RowData, row2: RowData) => number,
  style?: StyleObject,
}>;

// used internally in the Table component to track the sort selection
type SortInfo = $ReadOnly<{
  headerId: string,
  direction: SortDirection,
}>;

type Props<RowData> = {|
  /**
   * An array of data elements. Each data element is used to render a row, and
   * can be of any type.
   */
  data: $ReadOnlyArray<RowData>,

  /**
   * An array of TableHeader objects to represent each column in the table.
   *
   * - `id: string` Unique id of this column
   * - `centerHeader?: boolean` If the header content should be centered
   * - `displayContent?: React.Node` The column's header. Will default to `id`
   *   if no displayContent is given
   * - `headerClassName?: string` The class name to apply on the header cell
   * - `searchable?: (row: T) => ?string` A function that returns a searchable
   *   string for this column.
   * - `secondarySortKeys?: $ReadOnlyArray<string>` An array of column ids that
   *   will be used as secondary sorts when there is a tie
   * - `sortFn?: (row1: T, row2: T) => number` Comparator function to sort this
   *   column. The sort function must be in **ascending** order. Use the helper
   *   functions `Table.Sort.string | number | moment` to make this easy
   * - `style?: StyleObject` Any styles to apply to the header cell
   */
  headers: $ReadOnlyArray<TableHeader<RowData>>,

  /**
   * Render function that takes a row's data and returns a row. A row must be
   * of type `Table.Row`.
   * @param {T} rowData the row data
   * @returns {Table.Row}
   */
  renderRow: (rowData: RowData) => React.Element<typeof TableRow> | null,

  /**
   * `<Table>` uses `table-layout: fixed` by default because it is more
   * efficient, predictable, and responsive. Setting this to `true` will change
   * to `table-layout: auto` which auto-computes the widths of each column to
   * fit the content.
   */
  adjustWidthsToContent: boolean,
  className: string,

  /**
   * Takes a row's data and returns an array of keywords that this row can be
   * be searched by. This function overrides any `searchable` functions in your
   * `headers` configurations. Use this function instead of the `headers`
   * configuration if your keyword generation is stateful (meaning that you need
   * to access the props or state of the parent component).
   * @deprecated please don't use this anymore :'(
   */
  getSearchKeywords?: (rowData: RowData) => $ReadOnlyArray<?string> | void,

  /**
   * The initial column to sort by when this component mounts. Defaults to
   * Table.SortDirections.ASC
   */
  initialColumnToSort?: string,

  /**
   * If `initialColumnToSort` is set, this determines its initial sort order
   * These can be specified from `Table.SortDirections.ASC | DESC`
   */
  initialColumnSortOrder: SortDirection,

  /** Allow highlighting rows as you hover over them */
  isHoverable: boolean,

  /**
   * Callback for when a row gets clicked.
   * @param {T} rowData the row data
   * @param {number} rowIdx the index of the clicked row
   * @param {SyntheticEvent.HTMLTableRowElement} event
   */
  onRowClick?: (
    rowData: RowData,
    rowIdx: number,
    event: SyntheticEvent<HTMLTableRowElement>,
  ) => void,

  /**
   * The amount of items to show per page. Setting this will make a page
   * selector component show up on the bottom right of the table.
   */
  pageSize?: number,

  /** Text to display when the table is empty */
  noDataText: string,

  /** Text to display when a search returns no rows */
  noSearchResultsText: string,

  /**
   * Text to search for in the table. This makes the search input controlled
   * by the parent. If this is not set, but some columns have a `searchable`
   * function set, then the Table will render its own search box whose state
   * is internally managed.
   */
  searchText?: string,
  showHeaders: boolean,
|};

type State = {
  currentPage: number,
  searchText: string,
  sortInfo: SortInfo | void,
};

type SortDirectionMap = {
  ASC: 'ASC',
  DESC: 'DESC',
};

const SORT_DIRECTIONS: SortDirectionMap = {
  ASC: 'ASC',
  DESC: 'DESC',
};

/**
 * An easy way to turn an array of data into a table. You need to supply an
 * array of data, an array of header configurations, and a function that tells
 * the component how to render each row.
 *
 * Other features:
 * - searching: set a `searchable` function on each column that you want to make
 *   searchable.
 * - sorting: set a `sortFn` attribute on each column you want to make sortable
 *   in your `headers` prop. This sort function must be a comparator function in
 *   ascending order. The comparator function takes two items from the `data`
 *   array and returns a number. There are `Table.Sort.string` and
 *   `Table.Sort.number` helper functions to make this easier for you.
 */
export default class Table<RowData> extends React.Component<
  Props<RowData>,
  State,
> {
  static defaultProps = {
    adjustWidthsToContent: false,
    className: '',
    getSearchKeywords: undefined,
    initialColumnToSort: undefined,
    initialColumnSortOrder: 'ASC',
    isHoverable: true,
    noDataText: TEXT.noData,
    noSearchResultsText: TEXT.noResults,
    onRowClick: undefined,
    pageSize: undefined,
    searchText: undefined,
    showHeaders: true,
  };

  static Sort = TableSortUtil;
  static SortDirections = SORT_DIRECTIONS;
  static Cell = TableCell;
  static Row = TableRow;

  state = {
    currentPage: 1,
    searchText: '',
    sortInfo:
      this.props.initialColumnToSort !== undefined
        ? {
            headerId: this.props.initialColumnToSort,
            direction: this.props.initialColumnSortOrder,
          }
        : undefined,
  };

  // is the search text internally managed or passed by a prop?
  isSearchInternallyManaged(): boolean {
    return this.props.searchText === undefined;
  }

  // is the table searchable? (true if at least one header configuration has a
  // `searchable` function)
  isSearchable(): boolean {
    const { getSearchKeywords, headers } = this.props;
    return getSearchKeywords !== undefined || headers.some(h => !!h.searchable);
  }

  @memoizeOne
  buildSearchKeywordsPerRow(
    data: $ReadOnlyArray<RowData>,
    headers: $ReadOnlyArray<TableHeader<RowData>>,
    getSearchKeywords: void | (RowData => $ReadOnlyArray<?string> | void),
  ): Map<RowData, $ReadOnlyArray<?string> | void> {
    const rowMap = new Map();
    if (getSearchKeywords !== undefined) {
      data.forEach(d => {
        rowMap.set(d, getSearchKeywords(d));
      });
      return rowMap;
    }

    const searchableFns = headers.map(h => h.searchable).filter(Boolean);
    data.forEach(d => {
      const searchKeywords =
        searchableFns.length === 0 ? undefined : searchableFns.map(f => f(d));
      rowMap.set(d, searchKeywords);
    });
    return rowMap;
  }

  // create a reusable map to cache sorted data. If the source data or header
  // configurations ever change, then this map will get rebuilt.
  @memoizeOne
  buildSortedDataMap(
    data: $ReadOnlyArray<RowData>, // eslint-disable-line no-unused-vars
    // eslint-disable-next-line no-unused-vars
    headers: $ReadOnlyArray<TableHeader<RowData>>,
  ): Map<string, $ReadOnlyArray<RowData>> {
    return new Map();
  }

  // create a mapping of header id => TableHeader object
  buildHeadersMap(
    headers: $ReadOnlyArray<TableHeader<RowData>>,
  ): { [string]: TableHeader<RowData> } {
    const map = {};
    headers.forEach(headerObj => {
      map[headerObj.id] = headerObj;
    });
    return map;
  }

  getHeadersMap(): { [string]: TableHeader<RowData> } {
    return this.buildHeadersMap(this.props.headers);
  }

  /**
   * Get the row data sorted according to the selected column. This function
   * caches previous sorts so that we can return immediately if we have
   * sorted the data already.
   */
  getSortedData(sortInfo: SortInfo): $ReadOnlyArray<RowData> {
    const { data, headers } = this.props;
    const { headerId, direction } = sortInfo;
    const header = this.getHeader(headerId);

    // if we couldn't find a matching header for some strange reason, just
    const { sortFn, secondarySortKeys } = header;

    // if we have no sort function or sort direction then return the data as is
    if (sortFn === undefined || direction === undefined) {
      return data;
    }

    const dataMap = this.buildSortedDataMap(data, headers);
    const sortKey = `${headerId}-${direction}`;
    const sortedData = dataMap.get(sortKey);
    if (sortedData === undefined) {
      const multiplier = direction === 'DESC' ? -1 : 1;
      const otherSortFns = secondarySortKeys
        ? secondarySortKeys.map(k => this.getHeader(k).sortFn)
        : undefined;

      const newData = [...data].sort((a, b) => {
        let sortResult = sortFn(a, b);

        // in the event of a tie, look at the secondary sorts
        if (sortResult === 0 && otherSortFns) {
          // NOTE(pablo): for loop is intentional for performance
          for (let i = 0; i < otherSortFns.length; i++) {
            const newSortFn = otherSortFns[i];
            sortResult = newSortFn ? newSortFn(a, b) : 0;
            // we broke our tie, so stop applying the secondary sorts
            if (sortResult !== 0) {
              break;
            }
          }
        }

        return sortResult * multiplier;
      });
      dataMap.set(sortKey, newData);
      return newData;
    }
    return sortedData;
  }

  getSearchKeywordsPerRow(): Map<RowData, $ReadOnlyArray<?string> | void> {
    const { data, headers, getSearchKeywords } = this.props;
    return this.buildSearchKeywordsPerRow(data, headers, getSearchKeywords);
  }

  getSearchText(): string {
    if (this.isSearchInternallyManaged()) {
      return this.isSearchable() ? this.state.searchText : '';
    }
    return this.props.searchText || '';
  }

  /**
   * Given a header id, return the TableHeader object
   */
  getHeader(headerId: string): TableHeader<RowData> {
    const headersMap = this.getHeadersMap();
    invariant(
      headerId in headersMap,
      `[Table] '${headerId}' is not a valid column id`,
    );
    return headersMap[headerId];
  }

  /**
   * Get the row data filtered by the searchText
   */
  @memoizeOne
  getFilteredRowData(
    data: $ReadOnlyArray<RowData>,
    searchText: string,
  ): $ReadOnlyArray<RowData> {
    if (searchText === '') {
      return data;
    }

    const searchTerms = searchText.toLowerCase().split(' ');
    const searchKeywordsPerRow = this.getSearchKeywordsPerRow();
    return data.filter(row => {
      const searchKeywords = searchKeywordsPerRow.get(row);
      if (searchKeywords !== undefined) {
        // Every search term must be found in any of the keywords for this row
        // to pass. Rows with empty searchKeywords automatically will fail the
        // search.
        return searchTerms.every(searchTerm =>
          searchKeywords.some(keyword =>
            typeof keyword === 'string'
              ? keyword.toLowerCase().includes(searchTerm)
              : false,
          ),
        );
      }
      return false;
    });
  }

  /**
   * Return the data after transformations have been applied:
   * - sorted
   * - search text
   */
  getFinalRowData(): $ReadOnlyArray<RowData> {
    const { data } = this.props;
    const { sortInfo } = this.state;
    const rowData = sortInfo ? this.getSortedData(sortInfo) : data;
    return this.getFilteredRowData(rowData, this.getSearchText());
  }

  @autobind
  onPageChange(currentPage: number) {
    this.setState({ currentPage });
  }

  @autobind
  onSearchChange(searchText: string) {
    this.setState({ searchText });
  }

  @autobind
  onHeaderClick(headerId: string) {
    // toggle the sort direction of the clicked header
    this.setState(prevState => {
      const { sortInfo } = prevState;
      if (sortInfo && headerId === sortInfo.headerId) {
        const { direction } = sortInfo;
        let newSortInfo;
        if (direction === undefined || direction === 'DESC') {
          newSortInfo = { headerId, direction: 'ASC' };
        } else if (direction === 'ASC') {
          newSortInfo = { headerId, direction: 'DESC' };
        }
        return { sortInfo: newSortInfo };
      }

      return {
        sortInfo: { headerId, direction: 'ASC' },
      };
    });
  }

  maybeRenderPageSelector() {
    const { pageSize } = this.props;
    const { currentPage } = this.state;
    if (pageSize !== undefined) {
      return (
        <div className="zen-table-page-selector-container">
          <PageSelector
            className="zen-table-page-selector"
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={this.onPageChange}
            resultCount={this.getFinalRowData().length}
          />
        </div>
      );
    }
    return null;
  }

  maybeRenderSearchBox() {
    if (this.isSearchable() && this.isSearchInternallyManaged()) {
      return (
        <div className="zen-table-search-container">
          <InputText
            className="zen-table-search-input"
            icon="search"
            placeholder={TEXT.search}
            onChange={this.onSearchChange}
            value={this.state.searchText}
          />
        </div>
      );
    }
    return null;
  }

  maybeRenderTableHeader() {
    const { showHeaders, headers } = this.props;
    const { sortInfo } = this.state;

    // Allows user the option to not display headers
    if (!showHeaders) {
      return null;
    }

    const headerCells = headers.map(header => {
      const {
        id,
        centerHeader,
        displayContent,
        headerClassName,
        sortFn,
        style,
      } = header;
      const headerContent =
        displayContent === undefined || displayContent === null
          ? id
          : displayContent;
      const sortDirection =
        sortInfo && sortInfo.headerId === id ? sortInfo.direction : undefined;
      return (
        <TableHeaderCell
          key={id}
          id={id}
          centerHeader={centerHeader}
          className={headerClassName}
          isSortable={!!sortFn}
          onHeaderClick={this.onHeaderClick}
          sortDirection={sortDirection}
          style={style}
        >
          {headerContent}
        </TableHeaderCell>
      );
    });

    return (
      <thead className="zen-table__header">
        <tr>{headerCells}</tr>
      </thead>
    );
  }

  renderRows() {
    const {
      headers,
      pageSize,
      onRowClick,
      noSearchResultsText,
      noDataText,
      renderRow,
    } = this.props;
    const { currentPage } = this.state;
    const searchText = this.getSearchText();
    const rowData = this.getFinalRowData();

    if (searchText !== '' && rowData.length === 0) {
      // Search query did not return any results, so add an 'empty' row that
      // indicates this
      return (
        <tr className="zen-table__row">
          <TableCell colSpan={headers.length}>{noSearchResultsText}</TableCell>
        </tr>
      );
    }

    if (rowData.length === 0) {
      // Not currently searching, but we also have no data
      return (
        <tr className="zen-table__row">
          <TableCell colSpan={headers.length}>{noDataText}</TableCell>
        </tr>
      );
    }

    // get only the current page's data
    let finalData = [];
    if (pageSize === undefined) {
      finalData = rowData;
    } else {
      const startIdx = (currentPage - 1) * pageSize;
      const endIdx = Math.min(currentPage * pageSize, rowData.length);

      // intentionally using a for-loop instead of a more functional approach
      // to keep this slicing more efficient
      for (let i = startIdx; i < endIdx; i++) {
        finalData.push(rowData[i]);
      }
    }

    // Convert the final row data to actual rows now
    return finalData.map<React.Element<typeof TableRowWrapper> | null>(
      (row, idx) => {
        const rowElement = renderRow(row);
        if (rowElement !== undefined && rowElement !== null) {
          const { className, isSelected, disableClick, id } = rowElement.props;
          const key = rowElement.key || (id || uniqueId());
          return (
            <TableRowWrapper
              key={key}
              rowIdx={idx}
              data={row}
              onClick={onRowClick}
              disableClick={disableClick}
              className={className}
              isSelected={isSelected}
            >
              {rowElement}
            </TableRowWrapper>
          );
        }
        return null;
      },
    );
  }

  renderTable() {
    const { adjustWidthsToContent, isHoverable } = this.props;
    const className = classNames('zen-table', {
      'zen-table--is-hoverable': isHoverable,
      'zen-table--auto-table-layout': adjustWidthsToContent,
    });

    return (
      <table className={className}>
        {this.maybeRenderTableHeader()}
        {this.renderTableBody()}
      </table>
    );
  }

  renderTableBody() {
    return <tbody>{this.renderRows()}</tbody>;
  }

  render() {
    const { className, showHeaders } = this.props;
    const containerClassName = classNames(`zen-table-container ${className}`, {
      'zen-table-container--no-headers': !showHeaders,
    });
    return (
      <div className={containerClassName}>
        {this.maybeRenderSearchBox()}
        {this.renderTable()}
        {this.maybeRenderPageSelector()}
      </div>
    );
  }
}
