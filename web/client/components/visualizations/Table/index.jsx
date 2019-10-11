// @flow
import * as React from 'react';
import invariant from 'invariant';
import { ParentSize } from '@vx/responsive';

import ColorFilterTableCell from 'components/visualizations/Table/ColorFilterTableCell';
import CustomField from 'models/core/Field/CustomField';
import MatchTextHighlighter from 'components/ui/TextHighlighter/MatchTextHighlighter';
import ScorecardTableCell from 'components/visualizations/Table/ScorecardTableCell';
import StringMatcher from 'lib/StringMatcher';
import TableCore from 'components/ui/visualizations/Table';
import Visualization from 'components/visualizations/common/Visualization';
import ZenArray from 'util/ZenModel/ZenArray';
import ZenMap from 'util/ZenModel/ZenMap';
import autobind from 'decorators/autobind';
import memoizeOne from 'decorators/memoizeOne';
import {
  SORT_DIRECTION,
  mixedValueSort,
} from 'components/ui/visualizations/Table/util';
import {
  fieldIdsToName,
  formatFieldValueForDisplay,
  IndicatorLookup,
} from 'indicator_fields';
// $CycloneIdaiHack
// NOTE(stephen): We prefer to not rely on the legacy Field/CustomField types
// inside the table since it will make it more difficult to switch off those
// data types as AQT gets bigger.
import type Field from 'models/core/Field';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import { TIMESTAMP_GROUPING_ID } from 'models/core/QueryResultSpec/QueryResultGrouping';
import type QueryResultSeries from 'models/core/QueryResultSpec/QueryResultSeries';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type TableQueryResultData from 'components/visualizations/Table/models/TableQueryResultData';
// TODO(stephen): Move this import to somewhere else.
import type { ChartSize } from 'components/visualizations/BumpChart/types';
import type {
  ColumnSpec,
  SortDirection,
  SortState,
  TableCellProps,
} from 'components/ui/visualizations/Table/types';
import type { DataRow } from 'components/visualizations/Table/types';
import type { StyleObject } from 'types/jsCore';
import type { VisualizationProps } from 'components/visualizations/common/commonTypes';

type FieldID = string;
type SeriesObjectMap = { +[FieldID]: QueryResultSeries };

type Props = VisualizationProps<'TABLE'>;
type State = {
  searchText: string,
  searchTextMatcher?: StringMatcher,
  sortState: $ReadOnly<SortState>,
  userCustomizedSort: boolean,
};

type CellData = string | number | null;
type ColumnType = 'dimension' | 'metric';
type ColumnData = { type: ColumnType };
const COLUMN_TYPE: { [ColumnType]: ColumnType } = {
  dimension: 'dimension',
  metric: 'metric',
};

const TEXT = t('visualizations.Table');

function _sortRowsInplace(
  rows: Array<DataRow>,
  sortColumns: ZenArray<string>,
  sortDirectionMap: ZenMap<SortDirection>,
): Array<DataRow> {
  return rows.sort((a, b) => {
    let sortResult = 0;

    sortColumns.every(sortColumn => {
      sortResult = mixedValueSort(
        a[sortColumn],
        b[sortColumn],
        sortDirectionMap.get(sortColumn) === SORT_DIRECTION.DESC,
      );
      return sortResult === 0;
    });
    return sortResult;
  });
}

// HACK(stephen): Build a total row by summing the values in the query result.
// This should not be done on the frontend. But for MZ, their indicators are all
// summable, so we are safe to apply this hack there.
// $CycloneIdaiHack
const TOTAL_ROW_ID = 'TOTAL';
function _addTotalRowInplace(
  rows: Array<DataRow>,
  dimensions: $ReadOnlyArray<string>,
  fields: $ReadOnlyArray<Field | CustomField>,
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
  totalRow[dimensions[0]] = TOTAL_ROW_ID;

  // Initialize the field values to zero. Calculate custom fields at the end so
  // that we can still have accurate totals with frontend formulas.
  const customFields = [];
  const regularFields = [];
  fields.forEach(field => {
    totalRow[field.id()] = 0;
    if (field instanceof CustomField) {
      customFields.push(field);
    } else {
      regularFields.push(field);
    }
  });

  rows.forEach((row: DataRow) =>
    regularFields.forEach((field: Field) => {
      const fieldID = field.id();
      const value = row[fieldID];
      if (typeof value === 'number') {
        totalRow[fieldID] += value;
      }
    }),
  );
  customFields.forEach(field => {
    totalRow[field.id()] = field.formula().evaluateFormula(totalRow);
  });

  rows.push(totalRow);
  return rows;
}

export default class Table extends React.PureComponent<Props, State> {
  state = {
    searchText: '',
    searchTextMatcher: undefined,
    sortState: {
      sortColumns: ZenArray.create(),
      sortDirectionMap: ZenMap.create(),
    },
    userCustomizedSort: false,
  };

  componentDidMount() {
    const { groupBySettings, queryResult } = this.props;
    const visibleFields = this.getVisibleFields();
    if (visibleFields.length > 0) {
      this.updateSortFields(queryResult, visibleFields, groupBySettings);
    }
  }

  componentDidUpdate() {
    const { groupBySettings, queryResult } = this.props;
    const visibleFields = this.getVisibleFields();
    if (visibleFields.length > 0) {
      this.updateSortFields(queryResult, visibleFields, groupBySettings);
    }
  }

  @memoizeOne
  buildVisibleFields(
    seriesObjects: SeriesObjectMap,
    seriesOrder: $ReadOnlyArray<FieldID>,
  ): $ReadOnlyArray<FieldID> {
    // NOTE(stephen): Sets preserve insertion order, which is really nice. When
    // we convert to an array at the end, it will still be in the proper order.
    const output: Set<FieldID> = new Set();

    seriesOrder.forEach(seriesID => {
      const seriesObject = seriesObjects[seriesID];
      if (seriesObject.isVisible()) {
        output.add(seriesID);
        if (seriesObject.showConstituents()) {
          const indicator = IndicatorLookup[seriesID];
          if (indicator) {
            // NOTE(stephen): Backwards compatible way of storing constituents.
            const constituents = indicator.children || indicator.constituents;
            constituents.forEach(c => output.add(c));
          }
        }
      }
    });
    return Array.from(output);
  }

  @memoizeOne
  buildColumnSpecs(
    queryResult: TableQueryResultData,
    visibleFields: $ReadOnlyArray<FieldID>,
    seriesSettings: SeriesSettings,
    groupBySettings: GroupBySettings,
  ): $ReadOnlyArray<ColumnSpec<DataRow, CellData, ColumnData>> {
    const output = [];
    const seriesObjects = seriesSettings.seriesObjects();
    const queryResultGroupings = groupBySettings.groupings();

    queryResult.dimensions().forEach(dimensionID => {
      // NOTE(david, stephen): when queryResultGroupings is updated then
      // queryResult gets updated from a new request. However, the loading state
      // for queryResult is currently only set in componentDidUpdate so there is
      // a render of this component where queryResultGroupings has been updated
      // but queryResult has not. Therefore we need to check to make sure that
      // each dimension in queryResult appears in queryResultGroupings.
      const queryResultGrouping = queryResultGroupings.get(dimensionID);
      if (queryResultGrouping) {
        output.push({
          cellDataGetter: ({ rowData }) => rowData[dimensionID],
          columnData: { type: COLUMN_TYPE.dimension },
          dataKey: dimensionID,
          label: queryResultGrouping.displayLabel(),
        });
      }
    });

    visibleFields.forEach(fieldID => {
      const series = seriesObjects[fieldID];
      const label = series
        ? series.label()
        : fieldIdsToName[fieldID] || fieldID; // Default to ID if no lookup.
      const cellDataGetter = ({ rowData }) => {
        const val = rowData[fieldID];
        if (typeof val === 'number' && Number.isFinite(val)) {
          return formatFieldValueForDisplay(val, fieldID);
        }
        if (val === null || typeof val === 'undefined') {
          return TEXT.unavailable;
        }
        return TEXT.notANumber;
      };
      output.push({
        cellDataGetter,
        columnData: { type: COLUMN_TYPE.metric },
        dataKey: fieldID,
        label,
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
    sortColumns: ZenArray<string>,
    sortDirectionMap: ZenMap<SortDirection>,
    calculateTotal: boolean,
    fields: $ReadOnlyArray<Field | CustomField>,
  ): $ReadOnlyArray<DataRow> {
    const data = queryResult.data();
    if (sortColumns.size() === 0) {
      if (calculateTotal && data.length > 1) {
        return _addTotalRowInplace(
          data.slice(),
          queryResult.dimensions(),
          fields,
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

      const dimensions = queryResult.dimensions();
      rows = data.filter(row =>
        dimensions.some(dimension => {
          const dimensionValue = row[dimension];
          return (
            typeof dimensionValue === 'string' &&
            dimensionValue.length > 0 &&
            matcher.matchesSome(dimensionValue)
          );
        }),
      );
    } else {
      rows = data.slice();
    }

    const sortedRows = _sortRowsInplace(rows, sortColumns, sortDirectionMap);
    if (!calculateTotal || sortedRows.length <= 1) {
      return sortedRows;
    }

    return _addTotalRowInplace(sortedRows, queryResult.dimensions(), fields);
  }

  // Remove sort settings for fields that are no longer in the query result. If
  // no columns are being sorted on, set the first numeric field column as the
  // default sort.
  // NOTE(stephen): It is ok to access `this` inside this method since
  // queryResult and visibleFields changing is the *only* trigger we need.
  @memoizeOne
  updateSortFields(
    queryResult: TableQueryResultData,
    visibleFields: $ReadOnlyArray<FieldID>,
    groupBySettings: GroupBySettings,
  ) {
    const { userCustomizedSort } = this.state;
    // NOTE(stephen): Not using a Set here since the number of columns is small
    // enough to negate a potential performance gain.
    const displayedColumns = this.getColumnSpecs().map(
      ({ dataKey }) => dataKey,
    );

    this.setState(({ sortState }) => {
      const { sortColumns, sortDirectionMap } = sortState;
      const newSortDirection = {};
      // Ignore the currently selected sort columns if the user has not
      // customized the sort. We will want to apply a default sorting logic
      // in that case.
      const newSortColumns = !userCustomizedSort
        ? []
        : sortColumns.arrayView().filter(sortColumn => {
            if (!displayedColumns.includes(sortColumn)) {
              return false;
            }
            newSortDirection[sortColumn] = sortDirectionMap.get(sortColumn);
            return true;
          });

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
      } else if (newSortColumns.length === sortColumns.size()) {
        // Otherwise, if the list sizes are the same that implies the columns
        // are the same and the sorting is still valid.
        return undefined;
      }

      return {
        sortState: {
          sortColumns: ZenArray.create(newSortColumns),
          sortDirectionMap: ZenMap.create(newSortDirection),
        },
      };
    });
  }

  /**
   * Restructure the data to a columnar format so we can easily get the array
   * of all values per field
   */
  @memoizeOne
  getDataPerField(
    queryResult: TableQueryResultData,
  ): { [fieldId: string]: $ReadOnlyArray<?number> } {
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

  getColumnSpecs(): $ReadOnlyArray<ColumnSpec<DataRow, CellData, ColumnData>> {
    const { groupBySettings, queryResult, seriesSettings } = this.props;
    return this.buildColumnSpecs(
      queryResult,
      this.getVisibleFields(),
      seriesSettings,
      groupBySettings,
    );
  }

  getSortedData(): $ReadOnlyArray<DataRow> {
    const { controls, fields, queryResult } = this.props;
    const { sortState, searchTextMatcher } = this.state;
    return this.buildSortedData(
      queryResult,
      searchTextMatcher,
      sortState.sortColumns,
      sortState.sortDirectionMap,
      controls.addTotalRow,
      fields,
    );
  }

  getTableHeaderStyle(): StyleObject {
    const {
      headerBackground,
      headerColor,
      headerFontSize,
      headerBorderColor,
    } = this.props.controls;
    return {
      backgroundColor: headerBackground,
      borderColor: headerBorderColor,
      color: headerColor,
      fontSize: headerFontSize,
    };
  }

  getTableFooterStyle(): StyleObject {
    const {
      footerBackground,
      footerBorderColor,
      footerColor,
      footerFontSize,
    } = this.props.controls;
    return {
      backgroundColor: footerBackground,
      borderColor: footerBorderColor,
      color: footerColor,
      fontSize: footerFontSize,
    };
  }

  getDataRowStyle(backgroundColor: string): StyleObject {
    const { rowBorderColor, rowColor, rowFontSize } = this.props.controls;
    return {
      backgroundColor,
      borderColor: rowBorderColor,
      color: rowColor,
      fontSize: rowFontSize,
    };
  }

  @autobind
  getRowStyle({ index }: { index: number }): StyleObject {
    const {
      addTotalRow,
      rowAlternateBackground,
      rowBackground,
    } = this.props.controls;

    if (index === -1) {
      return this.getTableHeaderStyle();
    }

    // HACK(stephen, moriah): We only have a footer if the total row hack is
    // enabled. If total row is enabled and this row is the final row being
    // displayed, consider it the footer. THIS DOES NOT WORK WITH PAGINATION.
    if (addTotalRow && index === this.getSortedData().length - 1) {
      return this.getTableFooterStyle();
    }

    const backgroundColor = index % 2 ? rowAlternateBackground : rowBackground;
    return this.getDataRowStyle(backgroundColor);
  }

  @autobind
  onSearchTextChange(searchText: string) {
    const searchTextMatcher =
      searchText.length > 0 ? new StringMatcher([searchText]) : undefined;
    this.setState({ searchText, searchTextMatcher });
  }

  @autobind
  onSortClick(sortState: SortState) {
    this.setState({ sortState, userCustomizedSort: true });
  }

  @autobind
  maybeRenderTable({ height, width }: ChartSize) {
    const { loading, controls } = this.props;
    const visibleFields = this.getVisibleFields();
    if (loading || height === 0 || visibleFields.length === 0) {
      return null;
    }

    const rows = this.getSortedData();
    const enablePagination =
      controls.tableFormat !== 'scorecard' && controls.enablePagination;
    const { searchText, sortState } = this.state;
    // NOTE(stephen): Passing `controls` as a prop even though it is not used so
    // that we force a rerender if controls change. Since the core visualization
    // is a PureComponent, and rect-virtualized does a really good job avoiding
    // rerenders if the props don't change, controls changes don't trigger a
    // new call to `renderTableCell`.
    return (
      <TableCore
        cellRenderer={this.renderTableCell}
        columnSpecs={this.getColumnSpecs()}
        controls={controls}
        enablePagination={enablePagination}
        enableSearch
        height={height}
        initialSearchText={searchText}
        onSearchTextChange={this.onSearchTextChange}
        onSortChange={this.onSortClick}
        rowHeight={controls.rowHeight}
        rowStyle={this.getRowStyle}
        rows={rows}
        sortState={sortState}
        width={width}
      />
    );
  }

  @autobind
  renderTableCell(cellProps: TableCellProps<DataRow, CellData, ColumnData>) {
    const { cellData, columnData, dataKey, rowData } = cellProps;
    const rawValue = rowData[dataKey];

    if (columnData.type === COLUMN_TYPE.dimension) {
      const { searchTextMatcher } = this.state;
      // HACK(stephen): If this cell's value indicates the row is a Total row,
      // highlight the label.
      // TODO(stephen): This isn't the worst hack and might be kept in when we
      // support totals for real with AQT.
      // TODO(stephen): Translate.
      // $CycloneIdaiHack
      if (rawValue === TOTAL_ROW_ID) {
        return <b>Total</b>;
      }

      if (searchTextMatcher === undefined || rawValue === null) {
        const groupingObject = this.props.groupBySettings
          .groupings()
          .forceGet(dataKey);
        return cellData
          ? groupingObject.formatGroupingValue(cellData, false)
          : cellData;
      }

      invariant(
        typeof rawValue === 'string',
        'Dimension values are always returned as strings by the server.',
      );
      return (
        <MatchTextHighlighter matcher={searchTextMatcher} text={rawValue} />
      );
    }

    invariant(typeof rawValue !== 'string', 'Metrics are never strings.');
    const { controls, colorFilters, queryResult, seriesSettings } = this.props;
    const { rowHeight } = controls;

    const seriesObject = seriesSettings.seriesObjects()[dataKey];
    let displayValue = '';
    if (seriesObject) {
      displayValue = seriesObject.formatFieldValue(cellData);
    } else {
      // if there is no series object in our settings, then it means this
      // is a constituent, so we should get the displayValue from the
      // columnSpec itsel
      displayValue = formatFieldValueForDisplay(cellData, dataKey);
    }

    if (controls.tableFormat === 'scorecard') {
      if (rawValue === null || typeof rawValue === 'undefined') {
        return (
          <ScorecardTableCell
            blank
            displayValue={displayValue}
            height={rowHeight}
          />
        );
      }
      // NOTE(stephen): Dropped support for decreaseIsGood field flag since it
      // is barely used and does not work with AQT. If a user needs to flip the
      // coloration of a field, they should use the invert coloration control.
      const invertColoration = controls.invertedFields.includes(dataKey);
      let scorecardRank = queryResult.getScorecardRank(dataKey, rawValue);
      if (invertColoration && rawValue !== null) {
        scorecardRank = 1 - scorecardRank;
      }
      return (
        <ScorecardTableCell
          displayValue={displayValue}
          height={rowHeight}
          scorecardRank={scorecardRank}
        />
      );
    }

    const colorFilter = colorFilters.get(dataKey);
    const backgroundColor = colorFilter
      ? colorFilter.getValueColor(
          rawValue,
          this.getDataPerField(queryResult)[dataKey],
        )
      : undefined;

    return (
      <ColorFilterTableCell
        displayValue={displayValue}
        height={rowHeight}
        backgroundColor={backgroundColor}
      />
    );
  }

  render() {
    return (
      <Visualization
        className="table-visualization"
        loading={this.props.loading}
      >
        <div className="table-visualization__table">
          <ParentSize>{this.maybeRenderTable}</ParentSize>
        </div>
      </Visualization>
    );
  }
}
