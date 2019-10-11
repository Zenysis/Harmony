// @flow
import Field from 'models/core/wip/Field';
import LegacyField from 'models/core/Field';
import buildFilename from 'components/QueryResult/QueryResultActionButtons/ExportButton/buildFilename';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import type TableQueryResultData from 'components/visualizations/Table/models/TableQueryResultData';
import type { DataRow } from 'components/visualizations/Table/types';

// $CycloneIdaiHack
// TODO(pablo): a lot of this functionality has been extracted to reusable
// functions in util/export.js. However, this file has not yet been refactored
// to use those functions. Simplify the code here to re-use those functions.
// (Also you'll have to rename this file from `exportToExcel` to something else,
// because that name collides with the function name in util/export.js)

type XLSCellValue = {
  value: string | number,
  type: 'string' | 'number', // these are string literals
};

function _buildExcelRow(
  row: DataRow,
  keys: Array<string>,
): Array<XLSCellValue> {
  return keys.map(key => {
    const rawValue = row[key];
    const value = rawValue === undefined || rawValue === null ? '' : rawValue;
    let valueType: string;
    if (typeof value === 'string') {
      valueType = 'string';
    } else if (typeof value === 'number') {
      valueType = 'number';
    } else {
      throw new Error(
        '[exportToExcel] Invalid value type. Can only support numbers or strings.',
      );
    }

    return {
      value,
      type: valueType,
    };
  });
}

function _buildExcelHeaderRow(
  headerValues: Array<string>,
): Array<XLSCellValue> {
  return headerValues.map(value => ({
    value,
    type: 'string',
  }));
}

// NOTE(stephen): Require a fields array to be passed even though
// TableQueryResultData tracks fields because AQT and SQT create Fields
// differently.
export default function exportToExcel(
  queryResultData: TableQueryResultData,
  fields: Array<LegacyField> | Array<Field>,
  additionalColumns?: Array<string> = [],
): Promise<void> {
  // extract table data
  const columns = queryResultData.dimensions().concat(additionalColumns);
  const rows = queryResultData.data();
  const vendorPromise = VENDOR_SCRIPTS.zipcelx.load();

  // Fields used in CSV header
  const fieldLabels: Array<string> = fields.map(field => field.label());

  const headerValues = columns.concat(fieldLabels);
  const outputRows = [_buildExcelHeaderRow(headerValues)];
  const keys = columns.concat(LegacyField.pullIds(fields));
  rows.forEach(row => outputRows.push(_buildExcelRow(row, keys)));

  const filename = buildFilename(fieldLabels[0]);
  const config = {
    filename,
    sheet: {
      data: outputRows,
    },
  };
  return vendorPromise.then(() => {
    window.zipcelx(config);
  });
}

type CsvData = {
  filename: string,
  content: string,
};

function _buildCsvRow(row: DataRow, keys: Array<string>): string {
  const values = keys.map(key => {
    const rawValue = row[key];
    const value = rawValue === undefined || rawValue === null ? '' : rawValue;
    if (typeof value !== 'string' && typeof value !== 'number') {
      throw new Error(
        '[exportToExcel] Invalid value type. Can only support numbers or strings.',
      );
    }
    return value;
  });
  return values.join(',');
}

export function exportCsvData(
  queryResultData: TableQueryResultData,
  fields: Array<LegacyField> | Array<Field>,
  additionalColumns?: Array<string> = [],
): CsvData {
  // extract table data
  const columns = queryResultData.dimensions().concat(additionalColumns);
  const rows = queryResultData.data();

  // Fields used in CSV header
  const fieldLabels: Array<string> = fields.map(field => field.label());

  const headerValues = columns.concat(fieldLabels);

  const outputRows = [headerValues.join(',')];
  const keys = columns.concat(LegacyField.pullIds(fields));
  rows.forEach(row => outputRows.push(_buildCsvRow(row, keys)));

  const filename = buildFilename(fieldLabels[0]);
  const result = {
    filename: `${filename}.csv`,
    content: outputRows.join('\n'),
  };
  return result;
}
