// @flow
import { VENDOR_SCRIPTS } from 'vendor/registry';

/**
 * This file contains helper functions to export data.
 */

export type XLSHeader = {
  key: string,
  label: string,
};

export type XLSCellValue = {
  value: string | number,
  type: 'string' | 'number', // these are string literals
};

function _buildExcelRow(
  row: { [key: string]: string | number },
  headers: $ReadOnlyArray<XLSHeader>,
): Array<XLSCellValue> {
  return headers.map(({ key }) => {
    const rawValue = row[key];
    const value = rawValue === undefined || rawValue === null ? '' : rawValue;
    let valueType: string;
    if (typeof value === 'string') {
      valueType = 'string';
    } else if (typeof value === 'number') {
      valueType = 'number';
    } else {
      throw new Error(
        '[util/export] Invalid value type. Can only support numbers or strings.',
      );
    }

    return {
      value,
      type: valueType,
    };
  });
}

function _buildExcelHeaderRow(
  headerValues: $ReadOnlyArray<XLSHeader>,
): Array<XLSCellValue> {
  return headerValues.map(({ label }) => ({
    value: label,
    type: 'string',
  }));
}

export function exportToExcel(
  filename: string,
  headers: $ReadOnlyArray<XLSHeader>,
  rows: $ReadOnlyArray<{ [string]: string | number }>,
): Promise<void> {
  const outputRows = [_buildExcelHeaderRow(headers)];
  rows.forEach(row => outputRows.push(_buildExcelRow(row, headers)));
  const config = {
    filename,
    sheet: {
      data: outputRows,
    },
  };

  return VENDOR_SCRIPTS.zipcelx.load().then(() => {
    window.zipcelx(config);
  });
}
