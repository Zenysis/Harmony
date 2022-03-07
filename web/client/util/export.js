// @flow
import type Promise from 'bluebird';

import { VENDOR_SCRIPTS } from 'vendor/registry';

export type ExportDataRow = { +[string]: ?(string | number), ... };

/**
 * This file contains helper functions to export data.
 */

export type CSVData = {
  content: string,
  filename: string,
};

export type XLSHeader = {
  key: string,
  label: string,
};

export type XLSCellValue = {
  type: 'string' | 'number', // these are string literals
  value: string | number,
};

function _buildExcelRow(
  row: ExportDataRow,
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
      const valType = typeof value;
      throw new Error(
        `[util/export] Invalid value type. Can only support numbers or strings. Instead, received: '${valType}'`,
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
    type: 'string',
    value: label,
  }));
}

export function exportToExcel(
  filename: string,
  headers: $ReadOnlyArray<XLSHeader>,
  rows: $ReadOnlyArray<ExportDataRow>,
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

function _buildCSVRow(
  row: ExportDataRow,
  headers: $ReadOnlyArray<XLSHeader>,
): string {
  const values = headers.map(({ key }) => {
    const rawValue = row[key];

    const value = rawValue === undefined || rawValue === null ? '' : rawValue;
    if (typeof value !== 'string' && typeof value !== 'number') {
      throw new Error(
        '[exportToExcel] Invalid value type. Can only support numbers or strings.',
      );
    }
    return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
  });
  return values.join(',');
}

export function exportToCSV(
  filename: string,
  headers: $ReadOnlyArray<XLSHeader>,
  rows: $ReadOnlyArray<ExportDataRow>,
): CSVData {
  const headerValues = headers.map(header => header.label);
  // replace commas in CSV header values
  const outputRows = [`"${headerValues.join('","')}"`];
  rows.forEach(row => outputRows.push(_buildCSVRow(row, headers)));
  const outputFile = `${filename}.csv`;
  const outputData = outputRows.join('\n');

  // Actually trigger a data download.
  const data = new Blob([outputData], { type: 'csv' })
  const csvURL = window.URL.createObjectURL(data);
  
  const tempLink = document.createElement('a');
  tempLink.href = csvURL;
  tempLink.setAttribute('download', outputFile);
  tempLink.click();
  window.URL.createObjectURL(data)

  return {
    content: outputData,
    filename: outputFile,
  };

}
