// @flow
import * as React from 'react';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import CaseManagementInfoContext from 'components/QueryResult/CaseManagementInfoContext';
import ColorFilterTableCell from 'components/visualizations/Table/ColorFilterTableCell';
import DimensionTableCell from 'components/visualizations/Table/DimensionTableCell';
import DruidCaseType from 'models/CaseManagementApp/DruidCaseType';
import ScorecardTableCell from 'components/visualizations/Table/ScorecardTableCell';
import StringMatcher from 'lib/StringMatcher';
import TableCore from 'components/ui/visualizations/Table';
import TableLegend from 'components/visualizations/Table/TableLegend';
import Visualization from 'components/visualizations/common/Visualization';
import autobind from 'decorators/autobind';
import getLinkableCaseType from 'components/visualizations/Table/getLinkableCaseType';
import memoizeOne from 'decorators/memoizeOne';
import { COLUMN_TYPE } from 'components/visualizations/Table/constants';
import {
  SORT_DIRECTION,
  mixedValueSort,
} from 'components/ui/visualizations/Table/sorting';
import { TIMESTAMP_GROUPING_ID } from 'models/core/QueryResultSpec/QueryResultGrouping';
import { TOTAL_DIMENSION_VALUE } from 'models/visualizations/common/constants';
import {
  buildDataFrameFromFlatRows,
  evaluateCustomFields,
} from 'models/core/Field/CustomField/Formula/formulaUtil';
import { formatFieldValueForDisplay } from 'util/valueDisplayUtil';
import { getDruidCasePageURL } from 'components/CaseManagementApp/urlUtil';

import type CustomField from 'models/core/Field/CustomField';
import type DataActionGroup from 'models/core/QueryResultSpec/DataActionGroup';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type QueryResultSeries from 'models/core/QueryResultSpec/QueryResultSeries';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type TableQueryResultData from 'models/visualizations/Table/TableQueryResultData';
import type TableTheme from 'models/visualizations/Table/TableSettings/TableTheme';
import type {
  ColumnSpec,
  RowDivider,
  SortDirection,
  SortState,
  TableCellProps,
} from 'components/ui/visualizations/Table/types';
import type { ColumnType } from 'components/visualizations/Table/constants';
import type { DataRow } from 'models/visualizations/Table/types';
import type { StyleObject } from 'types/jsCore';
import type { VisualizationProps } from 'components/visualizations/common/commonTypes';

type FieldID = string;
type SeriesObjectMap = { +[FieldID]: QueryResultSeries, ... };

type DefaultProps = {
  onRowClick: (DataRow => void) | void,
};

type Props = {
  ...VisualizationProps<'TABLE'>,
  ...DefaultProps,
};

type State = {
  searchText: string,
  searchTextMatcher?: StringMatcher,
};

type ColumnData = { type: ColumnType };

// NOTE(moriah):Hide the "No Data" cell text when a value is null.
// TODO(stephen): Remove this override and add support to the series settings
// modal to let the user specify the value using the
// QueryResultSeries.nullValueDisplay option.
const HIDE_NULL_VALUES = false;

export function sortRowsInplace(
  rows: Array<DataRow>,
  sortColumns: Zen.Array<string>,
  sortDirectionMap: Zen.Map<SortDirection>,
  dimensions: $ReadOnlyArray<string>,
): Array<DataRow> {
  return rows.sort((a, b) => {
    let sortResult = 0;

    sortColumns.every(sortColumn => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      // Always sort the total row to be the last row in a block. A block is
      // defined as a set of rows where all sort columns *before* this one have
      // the same values.
      const aIsTotal = aVal === TOTAL_DIMENSION_VALUE;
      const bIsTotal = bVal === TOTAL_DIMENSION_VALUE;
      if (aIsTotal || (bIsTotal && aIsTotal !== bIsTotal)) {
        sortResult = aIsTotal ? 1 : -1;
        return false;
      }

      sortResult = mixedValueSort(
        aVal,
        bVal,
        sortDirectionMap.get(sortColumn) === SORT_DIRECTION.DESC,
      );

      const isDimension = dimensions.includes(sortColumn);
      const isNotLastDimension =
        sortColumn !== dimensions[dimensions.length - 1];
      if (isDimension && isNotLastDimension) {
        return sortResult === 0;
      }
      return true;
    });
    return sortResult;
  });
}

function _addTotalRowInplace(
  rows: Array<DataRow>,
  dimensions: $ReadOnlyArray<string>,
  seriesOrder: $ReadOnlyArray<FieldID>,
  customFields: $ReadOnlyArray<CustomField>,
): Array<DataRow> {
  if (rows.length <= 1 || dimensions.length === 0) {
    return rows;
  }

  const totalRow = {};

  // Initialize the dimensions to all be empty. Use the first dimension column
  // to indicate this row stores a total value.
  dimensions.forEach(dimensionID => {
    totalRow[dimensionID] = '';
  });
  totalRow[dimensions[0]] = TOTAL_DIMENSION_VALUE;

  // Initialize the field values to zero. Calculate custom fields at the end so
  // that we can still have accurate totals with frontend formulas.
  const regularFields = [];
  seriesOrder.forEach(id => {
    totalRow[id] = 0;
    const isCustomField = !!customFields.find(f => f.id() === id);
    if (!isCustomField) {
      regularFields.push(id);
    }
  });

  rows.forEach((row: DataRow) =>
    regularFields.forEach(fieldID => {
      const value = row[fieldID];
      if (typeof value === 'number') {
        totalRow[fieldID] += value;
      }
    }),
  );

  const customFieldTotals = evaluateCustomFields(
    customFields,
    // build a single-row dataframe just to evaluate the `totalRow`
    buildDataFrameFromFlatRows([totalRow], dimensions),
  );

  customFieldTotals.forEach(({ fieldId, values }) => {
    const val = values[0];
    totalRow[fieldId] = val;
  });

  rows.push(totalRow);
  return rows;
}

export default class Table extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    onRowClick: undefined,
  };

  static contextType: typeof CaseManagementInfoContext = CaseManagementInfoContext;
  context: $ContextType<typeof CaseManagementInfoContext>;

  state: State = {
    searchText: '',
    searchTextMatcher: undefined,
  };

  @memoizeOne
  buildVisibleFields(
    seriesObjects: SeriesObjectMap,
    seriesOrder: $ReadOnlyArray<FieldID>,
  ): $ReadOnlyArray<FieldID> {
    return seriesOrder.filter(seriesID => seriesObjects[seriesID].isVisible());
  }

  @memoizeOne
  buildColumnSpecs(
    queryResult: TableQueryResultData,
    visibleFields: $ReadOnlyArray<FieldID>,
    seriesSettings: SeriesSettings,
    groupBySettings: GroupBySettings,
    mergeCells: boolean,
    theme: TableTheme,
  ): $ReadOnlyArray<ColumnSpec<DataRow, ColumnData>> {
    const output = [];
    const seriesObjects = seriesSettings.seriesObjects();
    const queryResultGroupings = groupBySettings.groupings();
    const hasDimensionTotals = queryResult.hasDimensionTotals();

    const dimensions = queryResult.dimensions();
    dimensions.forEach((dimensionID, idx) => {
      // NOTE(david, stephen): when queryResultGroupings is updated then
      // queryResult gets updated from a new request. However, the loading state
      // for queryResult is currently only set in componentDidUpdate so there is
      // a render of this component where queryResultGroupings has been updated
      // but queryResult has not. Therefore we need to check to make sure that
      // each dimension in queryResult appears in queryResultGroupings.
      const queryResultGrouping = queryResultGroupings.get(dimensionID);
      const isNotLastDimension = idx !== dimensions.length - 1;
      if (queryResultGrouping) {
        const rotateHeader = theme
          .getHeaderColumnwiseThemeForColumn(dimensionID, 'dimension')
          .rotateHeader();
        output.push({
          // mergeCells added here to ensure collumns with merged cells are sorted
          alwaysSort: hasDimensionTotals || (mergeCells && isNotLastDimension),
          cellDataGetter: ({ rowData }) => rowData[dimensionID],
          columnData: { type: COLUMN_TYPE.dimension },
          dataKey: dimensionID,
          label: queryResultGrouping.displayLabel(),

          // Do not mark the last dimension as merged. Since that dimension is
          // the last one being queried, it will never have consecutive cells
          // that are identical (when you sort by the dimensions before it).
          mergeCells: mergeCells && isNotLastDimension,
          rotateHeader,
        });
      }
    });

    visibleFields.forEach(fieldID => {
      const series = seriesObjects[fieldID];
      const label = series ? series.label() : fieldID; // Default to ID if no lookup.
      const rotateHeader = theme
        .getHeaderColumnwiseThemeForColumn(fieldID, 'metric')
        .rotateHeader();
      output.push({
        cellDataGetter: ({ rowData }) => rowData[fieldID],
        columnData: { type: COLUMN_TYPE.metric },
        dataKey: fieldID,
        label,
        rotateHeader,
      });
    });
    return output;
  }

  // Produce a sorted array of data rows based on the user's column sorting
  // choices.
  @memoizeOne
  buildSortedData(
    queryResult: TableQueryResultData,
    searchTextMatcher?: StringMatcher,
    sortColumns: Zen.Array<string>,
    sortDirectionMap: Zen.Map<SortDirection>,
    calculateTotal: boolean,
    seriesOrder: $ReadOnlyArray<FieldID>,
    customFields: $ReadOnlyArray<CustomField>,
  ): $ReadOnlyArray<DataRow> {
    const data = queryResult.data();
    const dimensions = queryResult.dimensions();

    if (sortColumns.size() === 0) {
      if (calculateTotal && data.length > 1) {
        return _addTotalRowInplace(
          data.slice(),
          queryResult.dimensions(),
          seriesOrder,
          customFields,
        );
      }
      return data;
    }

    let rows;
    if (searchTextMatcher !== undefined) {
      // HACK(stephen): Prove to flow that searchTextMatcher does not get
      // reassigned at some point. Since we allow function params to be
      // reassigned in the .flowconfig, Flow struggles to know that it doesn't
      // change and that the refinement above is still valid.
      const matcher = searchTextMatcher;
      const groupings = this.props.groupBySettings.groupings();

      rows = data.filter(row =>
        dimensions.some(dimension => {
          const groupingObject = groupings.forceGet(dimension);
          const dimensionValue = row[dimension];
          const formattedValue = dimensionValue
            ? groupingObject.formatGroupingValue(dimensionValue, false)
            : dimensionValue;
          return (
            typeof formattedValue === 'string' &&
            formattedValue.length > 0 &&
            matcher.matchesSome(formattedValue)
          );
        }),
      );
    } else {
      rows = data.slice();
    }

    const sortedRows = sortRowsInplace(
      rows,
      sortColumns,
      sortDirectionMap,
      dimensions,
    );
    if (!calculateTotal || sortedRows.length <= 1) {
      return sortedRows;
    }

    return _addTotalRowInplace(
      sortedRows,
      queryResult.dimensions(),
      seriesOrder,
      customFields,
    );
  }

  // Remove sort settings for fields that are no longer in the query result. If
  // no columns are being sorted on, set the first numeric field column as the
  // default sort.
  // NOTE(stephen): It is ok to access `this` inside this method since
  // queryResult and visibleFields changing is the *only* trigger we need.
  @memoizeOne
  buildSortState(
    queryResult: TableQueryResultData,
    visibleFields: $ReadOnlyArray<FieldID>,
    groupBySettings: GroupBySettings,
    seriesSettings: SeriesSettings,
    userSort: {
      sortColumn: string,
      sortDirection: SortDirection,
    },
    mergeTableCells: boolean,
    tableTheme: TableTheme,
  ): SortState {
    if (visibleFields.length === 0) {
      return {
        sortColumns: Zen.Array.create(),
        sortDirectionMap: Zen.Map.create(),
      };
    }
    const { sortColumn, sortDirection } = userSort;

    const newSortDirection = {};

    // Ensure any columns that *require* being sorted are included first.
    const newSortColumns = [];
    const availableColumns = new Set();

    // NOTE(stephen.byarugaba & David) Calling buildColumnSpecs directly as this is a memoized
    // function so we don't want to add hidden dependencies by calling getColumnSpecs
    this.buildColumnSpecs(
      queryResult,
      this.getVisibleFields(),
      seriesSettings,
      groupBySettings,
      mergeTableCells,
      tableTheme,
    ).forEach(({ alwaysSort, dataKey }) => {
      availableColumns.add(dataKey);
      if (alwaysSort) {
        newSortColumns.push(dataKey);
        newSortDirection[dataKey] = SORT_DIRECTION.ASC;
      }
    });

    // Ensures that the sortColumn is visible and has not been removed
    if (availableColumns.has(sortColumn)) {
      newSortColumns.push(sortColumn);
      newSortDirection[sortColumn] = sortDirection;
    }

    // If no columns are being sorted on, set the first numeric column to be
    // the default sort.
    if (newSortColumns.length === 0) {
      if (groupBySettings.hasOnlyDateGrouping()) {
        // If we are only grouping by the time dimension, we should default to
        // sorting by time in ascending order.
        newSortColumns.push(TIMESTAMP_GROUPING_ID);
        newSortDirection[TIMESTAMP_GROUPING_ID] = SORT_DIRECTION.ASC;
      } else {
        // Otherwise, set the first numeric column to be the default sort
        // column and sort descending.
        const defaultField = visibleFields[0];
        invariant(
          defaultField !== undefined,
          'Somehow all numeric columns were hidden or do not exist.',
        );
        newSortColumns.push(defaultField);
        newSortDirection[defaultField] = SORT_DIRECTION.DESC;
      }
    }

    return {
      sortColumns: Zen.Array.create(newSortColumns),
      sortDirectionMap: Zen.Map.create(newSortDirection),
    };
  }

  @memoizeOne
  buildLinkableCaseType(
    allDruidCaseTypes: Zen.Map<DruidCaseType>,
    groupBySettings: GroupBySettings,
  ): DruidCaseType | void {
    return getLinkableCaseType(allDruidCaseTypes, groupBySettings);
  }

  /**
   * Check if the case page linking setting has been set, if the user
   * has the right permissions to view case management pages, and if
   * the right dimensions have been queried for to support case linking.
   */
  isCasePageLinkingEnabled(): boolean {
    return (
      this.context.canUserViewCaseManagement &&
      this.props.controls.enableCasePageLinking()
    );
  }

  getLinkableCaseType(): DruidCaseType | void {
    return this.buildLinkableCaseType(
      this.context.allDruidCaseTypes,
      this.props.groupBySettings,
    );
  }

  /**
   * Restructure the data to a columnar format so we can easily get the array
   * of all values per field
   */
  @memoizeOne
  getDataPerField(
    queryResult: TableQueryResultData,
  ): { [fieldId: string]: $ReadOnlyArray<?number>, ... } {
    const columns = {};
    queryResult.data().forEach(dataObj => {
      Object.keys(dataObj).forEach(key => {
        if (columns[key] === undefined) {
          columns[key] = [];
        }
        columns[key].push(dataObj[key]);
      });
    });
    return columns;
  }

  getVisibleFields(): $ReadOnlyArray<FieldID> {
    const { seriesSettings } = this.props;
    return this.buildVisibleFields(
      seriesSettings.seriesObjects(),
      seriesSettings.seriesOrder(),
    );
  }

  getColumnSpecs(): $ReadOnlyArray<ColumnSpec<DataRow, ColumnData>> {
    const {
      controls,
      groupBySettings,
      queryResult,
      seriesSettings,
    } = this.props;
    return this.buildColumnSpecs(
      queryResult,
      this.getVisibleFields(),
      seriesSettings,
      groupBySettings,
      controls.mergeTableCells(),
      controls.getTheme(),
    );
  }

  getCasePageLink(rowData: DataRow): string | void {
    const linkableCaseType = this.getLinkableCaseType();
    if (this.isCasePageLinkingEnabled() && linkableCaseType) {
      const caseTypeDimension = linkableCaseType.primaryDruidDimension();
      const dimensionValue = rowData[caseTypeDimension];
      if (typeof dimensionValue === 'string')
        return getDruidCasePageURL(caseTypeDimension, {
          [caseTypeDimension]: dimensionValue,
        });
    }
    return undefined;
  }

  @autobind
  getRowContentWrapper(
    rowElement: React.MixedElement,
    rowData: DataRow,
    index: number,
  ): React.MixedElement {
    const style = this.getRowStyle(index);

    if (this.isCasePageLinkingEnabled()) {
      const href = this.getCasePageLink(rowData);
      return (
        <a
          className="table-visualization__hyperlinked-row"
          href={href}
          rel="noopener noreferrer"
          style={style}
          target="_blank"
        >
          {rowElement}
        </a>
      );
    }

    return <div style={style}>{rowElement}</div>;
  }

  getSortedData(): $ReadOnlyArray<DataRow> {
    const { controls, customFields, queryResult, seriesSettings } = this.props;
    const { searchTextMatcher } = this.state;
    const { sortColumns, sortDirectionMap } = this.getSortState();
    return this.buildSortedData(
      queryResult,
      searchTextMatcher,
      sortColumns,
      sortDirectionMap,
      controls.addTotalRow(),
      seriesSettings.seriesOrder(),
      customFields,
    );
  }

  getColumnAlignmentStyle(
    columnId: string,
    columnType: ColumnType,
  ): StyleObject {
    const alignment = this.props.controls
      .getTheme()
      .getColumnThemeForColumn(columnId, columnType)
      .alignment();

    let justifyContent = 'flex-start';
    if (alignment === 'center') {
      justifyContent = 'center';
    } else if (alignment === 'right') {
      justifyContent = 'flex-end';
    }

    return { justifyContent };
  }

  getColumnWidthStyle(
    columnId: string,
    columnType: ColumnType,
  ): StyleObject | void {
    const { controls } = this.props;

    const theme = controls.getTheme();
    const useFixedWidthRatios = theme
      .tableStyleTheme()
      .useFixedColumnWidthRatios();

    if (useFixedWidthRatios) {
      const ratio = theme
        .getColumnThemeForColumn(columnId, columnType)
        .widthRatio();

      return {
        flex: `${ratio} ${ratio} 0`,
        maxWidth: null,
        minWidth: null,
      };
    }

    return undefined;
  }

  getTableHeaderStyle(): StyleObject | void {
    const headerGeneralTheme = this.props.controls
      .getTheme()
      .headerGeneralTheme();

    const {
      displayHeaderLine,
      headerLineColor,
      headerLineThickness,
    } = headerGeneralTheme.modelValues();

    const borderBottom = displayHeaderLine
      ? `${headerLineThickness}px solid ${headerLineColor}`
      : 'None';

    return {
      borderBottom,
    };
  }

  getCellStyle(
    columnId: string,
    columnType: ColumnType,
    rowIndex: number,
    isMergedCell: boolean,
    isTotalRow: boolean,
  ): StyleObject | void {
    const { controls } = this.props;

    const height = controls.rowHeight();

    const worksheetTheme = controls
      .getTheme()
      .getWorksheetThemeForColumn(columnId, columnType);

    const tableStyleTheme = controls.getTheme().tableStyleTheme();
    const totalTheme = controls.getTheme().totalTheme();

    const {
      backgroundColor,
      boldText,
      textColor,
      textFont,
      textSize,
    } = worksheetTheme.modelValues();

    const enableRowBanding =
      rowIndex % 2 === 1 && tableStyleTheme.rowBandingColor() !== null;

    let cellBackgroundColor = 'transparent';

    if (enableRowBanding && !isMergedCell) {
      cellBackgroundColor = tableStyleTheme.rowBandingColor();
    } else if (backgroundColor !== null) {
      cellBackgroundColor = backgroundColor;
    }

    if (isTotalRow) {
      const totalThemeBackgroundColor = totalTheme.backgroundColor();
      return {
        ...this.getColumnAlignmentStyle(columnId, columnType),
        backgroundColor:
          totalThemeBackgroundColor !== null
            ? totalThemeBackgroundColor
            : cellBackgroundColor,
        color: totalTheme.textColor(),
        fontFamily: totalTheme.textFont(),
        fontSize: totalTheme.textSize(),
        fontWeight: totalTheme.boldText() ? 'bold' : 'normal',
        height,
        lineHeight: `${height}px`,
      };
    }

    return {
      ...this.getColumnAlignmentStyle(columnId, columnType),
      backgroundColor: cellBackgroundColor,
      color: textColor,
      fontFamily: textFont,
      fontSize: textSize,
      fontWeight: boldText ? 'bold' : 'normal',
      height,
      lineHeight: `${height}px`,
    };
  }

  @autobind
  getCellWrapperStyle(
    columnSpec: ColumnSpec<DataRow, ColumnData>,
  ): StyleObject | void {
    const columnId = columnSpec.dataKey;
    const columnType = columnSpec.columnData.type;

    return this.getColumnWidthStyle(columnId, columnType);
  }

  @autobind
  getHeaderCellStyle(
    columnSpec: ColumnSpec<DataRow, ColumnData>,
  ): StyleObject | void {
    const { controls } = this.props;

    const columnId = columnSpec.dataKey;
    const columnType = columnSpec.columnData.type;

    const headerTheme = controls
      .getTheme()
      .getHeaderColumnwiseThemeForColumn(columnId, columnType);

    const {
      backgroundColor,
      boldText,
      textColor,
      textFont,
      textSize,
    } = headerTheme.modelValues();

    return {
      ...this.getColumnAlignmentStyle(columnId, columnType),
      ...this.getColumnWidthStyle(columnId, columnType),
      backgroundColor,
      color: textColor,
      fontFamily: textFont,
      fontSize: textSize,
      fontWeight: boldText ? 'bold' : 'normal',
    };
  }

  getTableFooterStyle(): StyleObject {
    const {
      footerBackground,
      footerBorderColor,
      footerColor,
      footerFontSize,
    } = this.props.controls.modelValues();
    return {
      backgroundColor: footerBackground,
      borderColor: footerBorderColor,
      color: footerColor,
      fontSize: footerFontSize,
    };
  }

  @autobind
  getRowStyle(index: number): StyleObject {
    // HACK(stephen, moriah): We only have a footer if the total row hack is
    // enabled. If total row is enabled and this row is the final row being
    // displayed, consider it the footer. THIS DOES NOT WORK WITH PAGINATION.
    if (
      this.props.controls.addTotalRow() &&
      index === this.getSortedData().length - 1
    ) {
      return this.getTableFooterStyle();
    }

    return { backgroundColor: undefined };
  }

  @autobind
  getRowDivider(): RowDivider | void {
    const gridlinesTheme = this.props.controls.getTheme().gridlinesTheme();

    return {
      color: gridlinesTheme.color(),
      thickness: gridlinesTheme.thickness(),
    };
  }

  getSortState(): SortState {
    const {
      controls,
      groupBySettings,
      queryResult,
      seriesSettings,
    } = this.props;
    const visibleFields = this.getVisibleFields();
    return this.buildSortState(
      queryResult,
      visibleFields,
      groupBySettings,
      seriesSettings,
      controls.userSort(),
      controls.mergeTableCells(),
      controls.getTheme(),
    );
  }

  @autobind
  getTableStyle(): StyleObject | void {
    const { controls } = this.props;

    const tableStyleTheme = controls.getTheme().tableStyleTheme();

    const {
      backgroundColor,
      borderColor,
      roundCorners,
    } = tableStyleTheme.modelValues();

    return {
      backgroundColor,
      border: borderColor !== null ? `1px solid ${borderColor}` : undefined,
      borderRadius: roundCorners ? '3px' : undefined,
    };
  }

  @autobind
  onSearchTextChange(searchText: string) {
    const searchTextMatcher =
      searchText.length > 0 ? new StringMatcher([searchText]) : undefined;
    this.setState({ searchText, searchTextMatcher });
  }

  @autobind
  onSortClick(sortState: SortState) {
    const {
      controls,
      groupBySettings,
      queryResult,
      seriesSettings,
    } = this.props;
    const { sortColumns, sortDirectionMap } = sortState;

    const alwaysSortCols = new Set();
    this.buildColumnSpecs(
      queryResult,
      this.getVisibleFields(),
      seriesSettings,
      groupBySettings,
      controls.mergeTableCells(),
      controls.getTheme(),
    ).forEach(({ alwaysSort, dataKey }) => {
      if (alwaysSort) {
        alwaysSortCols.add(dataKey);
      }
    });
    // Save only the sort column that the user has clicked (remove the columns
    // that are always sorted on, which are the merged dimensions)
    const newSortColumn = sortColumns
      .filter(column => !alwaysSortCols.has(column))
      .first();

    this.props.onControlsSettingsChange('userSort', {
      sortColumn: newSortColumn,
      sortDirection: sortDirectionMap.get(newSortColumn, undefined),
    });
  }

  maybeRenderTableCore(height: number, width: number): React.Node {
    const { controls, loading, onRowClick } = this.props;
    const { allDruidCaseTypes } = this.context;
    const visibleFields = this.getVisibleFields();
    if (loading || height === 0 || visibleFields.length === 0) {
      return null;
    }

    const rows = this.getSortedData();
    const enablePagination =
      rows.length > 1 &&
      controls.tableFormat() !== 'scorecard' &&
      controls.enablePagination();
    const fitWidth = controls.fitWidth();
    const maxColumnWidth = controls.maxColumnWidth();
    const minColumnWidth = controls.minColumnWidth();
    const wrapColumnTitles = controls.wrapColumnTitles();

    const { searchText } = this.state;
    // NOTE(stephen): Passing `controls` and `allDruidCaseTypes` as a prop even
    // though it is not used so that we force a rerender if either of these
    // change. Since the core visualization is a PureComponent, and
    // rect-virtualized does a really good job avoiding rerenders if the props
    // don't change, controls changes don't trigger a new call to
    // `renderTableCell`.
    return (
      <TableCore
        allDruidCaseTypes={allDruidCaseTypes}
        cellRenderer={this.renderTableCell}
        columnSpecs={this.getColumnSpecs()}
        controls={controls}
        enablePagination={enablePagination}
        enableSearch={rows.length > 1 || searchText.length >= 1}
        fitWidth={fitWidth}
        getCellWrapperStyle={this.getCellWrapperStyle}
        getHeaderCellStyle={this.getHeaderCellStyle}
        headerRowStyle={this.getTableHeaderStyle()}
        height={height}
        initialSearchText={searchText}
        maxColumnWidth={Number(maxColumnWidth)}
        minColumnWidth={Number(minColumnWidth)}
        onRowClick={onRowClick}
        onSearchTextChange={this.onSearchTextChange}
        onSortChange={this.onSortClick}
        rowContentWrapper={this.getRowContentWrapper}
        rowDivider={this.getRowDivider()}
        rowHeight={controls.rowHeight()}
        rows={rows}
        sortState={this.getSortState()}
        tableContentsStyle={this.getTableStyle()}
        width={width}
        wrapColumnTitles={wrapColumnTitles}
      />
    );
  }

  maybeRenderLegend(): React.Node {
    const { legendSettings, queryResult, seriesSettings } = this.props;
    if (!legendSettings || !legendSettings.showLegend()) {
      return null;
    }
    return (
      <TableLegend
        legendSettings={legendSettings}
        seriesSettings={seriesSettings}
        seriesValues={this.getDataPerField(queryResult)}
      />
    );
  }

  renderColorFilterTableCell(
    dataKey: string,
    displayValue: string | number,
    rawValue: number | null,
    dataActionGroup: DataActionGroup | void,
    rowIndex: number,
    isTotalRow: boolean,
  ): React.Node {
    const { queryResult } = this.props;
    const backgroundColor =
      dataActionGroup !== undefined
        ? dataActionGroup.getValueColor(
            rawValue,
            this.getDataPerField(queryResult)[dataKey],
          )
        : undefined;

    const newDisplayValue =
      dataActionGroup !== undefined
        ? dataActionGroup.getTransformedText(
            rawValue,
            this.getDataPerField(queryResult)[dataKey],
          )
        : undefined;

    const cellStyle = this.getCellStyle(
      dataKey,
      COLUMN_TYPE.metric,
      rowIndex,
      false,
      isTotalRow,
    );

    const newBackgroundColor =
      backgroundColor === '' ? undefined : backgroundColor;

    return (
      <ColorFilterTableCell
        backgroundColor={newBackgroundColor}
        displayValue={newDisplayValue || displayValue}
        style={cellStyle}
      />
    );
  }

  @autobind
  renderScorecardTableCell(
    dataKey: string,
    displayValue: string | number,
    rawValue: number | null,
    rowIndex: number,
    isTotalRow: boolean,
  ): React.Node {
    const { controls, queryResult } = this.props;

    const cellStyle = this.getCellStyle(
      dataKey,
      COLUMN_TYPE.metric,
      rowIndex,
      false,
      isTotalRow,
    );

    if (!Number.isFinite(rawValue)) {
      return (
        <ScorecardTableCell
          blank
          displayValue={displayValue}
          style={cellStyle}
        />
      );
    }
    // NOTE(stephen): Dropped support for decreaseIsGood field flag since it
    // is barely used and does not work with AQT. If a user needs to flip the
    // coloration of a field, they should use the invert coloration control.
    const invertColoration = controls.invertedFields().includes(dataKey);
    let scorecardRank = queryResult.getScorecardRank(dataKey, rawValue);
    if (invertColoration && rawValue !== null) {
      scorecardRank = 1 - scorecardRank;
    }
    return (
      <ScorecardTableCell
        displayValue={displayValue}
        scorecardRank={scorecardRank}
        style={cellStyle}
      />
    );
  }

  renderDimensionCell(
    cellData: string | number | null,
    rawValue: string | number | null,
    dataKey: string,
    rowData: DataRow,
    rowIndex: number,
    isMergedCell: boolean,
    isGrandTotal: boolean,
    isTotalRow: boolean,
  ): React.Node {
    const { groupBySettings } = this.props;
    const { searchTextMatcher } = this.state;

    const cellStyle = this.getCellStyle(
      dataKey,
      COLUMN_TYPE.dimension,
      rowIndex,
      isMergedCell,
      isTotalRow,
    );

    return (
      <DimensionTableCell
        cellData={cellData}
        grouping={groupBySettings.groupings().forceGet(dataKey)}
        isGrandTotal={isGrandTotal}
        isTotalRow={isTotalRow}
        rawValue={rawValue}
        searchTextMatcher={searchTextMatcher}
        style={cellStyle}
      />
    );
  }

  @autobind
  renderTableCell(cellProps: TableCellProps<DataRow, ColumnData>): React.Node {
    const { controls, queryResult, seriesSettings } = this.props;
    const {
      cellData,
      columnData,
      dataKey,
      isMergedCell,
      rowData,
      rowIndex,
    } = cellProps;
    const rawValue = rowData[dataKey];
    const dimensionsWithTotals = queryResult.getDimensionsWithTotals();
    const isTotalRow = Object.values(rowData).some(
      value => value === TOTAL_DIMENSION_VALUE,
    );

    if (columnData.type === COLUMN_TYPE.dimension) {
      const isGrandTotal = dimensionsWithTotals[0] === dataKey;
      return this.renderDimensionCell(
        cellData,
        rawValue,
        dataKey,
        rowData,
        rowIndex,
        isMergedCell,
        isGrandTotal,
        isTotalRow,
      );
    }

    invariant(typeof rawValue !== 'string', 'Metrics are never strings.');
    const seriesObject = seriesSettings.getSeriesObject(dataKey);
    let displayValue = '';
    if (seriesObject !== undefined) {
      // TODO(stephen, anyone): This should be removed when the series settings
      // UI allows the `QueryResultSeries.nullValueDisplay` property to be
      // configured.
      if (HIDE_NULL_VALUES && (cellData === null || cellData === '')) {
        displayValue = '';
      } else {
        displayValue = seriesObject.formatFieldValue(cellData);
      }
    } else {
      // if there is no series object in our settings, then it means this
      // is a constituent, so we should get the displayValue from the
      // columnSpec itsel
      displayValue = formatFieldValueForDisplay(cellData);
    }

    const dataActions = seriesSettings.getSeriesDataActionGroup(dataKey);
    const tableCell =
      controls.tableFormat() === 'scorecard'
        ? this.renderScorecardTableCell(
            dataKey,
            displayValue,
            rawValue,
            rowIndex,
            isTotalRow,
          )
        : this.renderColorFilterTableCell(
            dataKey,
            displayValue,
            rawValue,
            dataActions,
            rowIndex,
            isTotalRow,
          );

    return tableCell;
  }

  @autobind
  renderTable(height: number, width: number): React.Node {
    return (
      <div className="table-visualization__table">
        {this.maybeRenderTableCore(height, width)}
      </div>
    );
  }

  render(): React.Node {
    return (
      <Visualization
        className="table-visualization"
        footer={this.maybeRenderLegend()}
        loading={this.props.loading}
      >
        {this.renderTable}
      </Visualization>
    );
  }
}
