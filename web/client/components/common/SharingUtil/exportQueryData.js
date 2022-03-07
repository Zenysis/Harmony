// @flow
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import QueryResultGrouping from 'models/core/QueryResultSpec/QueryResultGrouping';
import buildFilename from 'components/common/SharingUtil/buildFilename';
import { exportToCSV, exportToExcel } from 'util/export';
import type CustomField from 'models/core/Field/CustomField';
import type Field from 'models/core/wip/Field';
import type TableQueryResultData from 'models/visualizations/Table/TableQueryResultData';
import type { DataRow, DimensionID } from 'models/visualizations/Table/types';
import type { XLSHeader, CSVData } from 'util/export';

/**
 * Reformats the query data in order to export it as a CSV/Excel
 */

// any column headers that are groupings use user-readable format
function _getGroupHeader(
  dimensionID: DimensionID,
  groupings: Zen.Map<QueryResultGrouping>,
): XLSHeader {
  const grouping = groupings.get(dimensionID);
  const label = grouping === undefined ? dimensionID : grouping.label();
  return {
    key: dimensionID,
    label: label === undefined ? dimensionID : label,
  };
}

function _processRows(
  rows: $ReadOnlyArray<DataRow>,
  groupings: Zen.Map<QueryResultGrouping>,
  formatDateGroup: boolean,
) {
  return rows.map(row => {
    const { timestamp } = row;
    if (timestamp === null || timestamp === undefined) {
      return row;
    }
    const dateGroup = groupings.get('timestamp');
    if (dateGroup !== undefined) {
      const datetime = formatDateGroup ? dateGroup.formatGroupingValue(timestamp, true) : timestamp;
      return {
        ...row,
        timestamp: datetime,
      };
    }
    return row;
  });
}

// NOTE(stephen): Require a fields array to be passed even though
// TableQueryResultData tracks fields because AQT and SQT create Fields
// differently.
/* ::
declare function exportQueryData(
  queryResultData: TableQueryResultData,
  fields: Array<CustomField | Field>,
  format: 'excel',
  groupings?: Zen.Map<QueryResultGrouping>,
  additionalColumns?: Array<string>,
  formatDateGroup?: boolean
): Promise<void>;
declare function exportQueryData(
  queryResultData: TableQueryResultData,
  fields: Array<CustomField | Field>,
  format: 'csv',
  groupings?: Zen.Map<QueryResultGrouping>,
  additionalColumns?: Array<string>,
  formatDateGroup?: boolean
): CSVData;
*/
export default function exportQueryData(
  queryResultData: TableQueryResultData,
  fields: Array<CustomField | Field>,
  format: 'excel' | 'csv',
  groupings?: Zen.Map<QueryResultGrouping> = Zen.Map.create(),
  additionalColumns?: Array<string> = [],
  formatDateGroup?: boolean = true,
): Promise<void> | CSVData {
  // extract table data
  const columns = queryResultData.dimensions().concat(additionalColumns);
  const rows = queryResultData.data();
  const headers: Array<XLSHeader> = [];
  // add the labels for the groups
  columns.forEach(column => headers.push(_getGroupHeader(column, groupings)));
  fields.forEach(field =>
    headers.push({
      key: field.get('id'),
      label: field.get('label'),
    }),
  );
  const processedRows = _processRows(rows, groupings, formatDateGroup);
  const firstField = fields[0];
  const filename = buildFilename(firstField.get('label'));
  return format === 'excel'
    ? exportToExcel(filename, headers, processedRows)
    : exportToCSV(filename, headers, processedRows);
}
