// @flow
import * as React from 'react';

import { exportToExcel } from 'util/export';
import type { ExportDataRow, XLSHeader } from 'util/export';

/**
 * This hook returns a function that can be called to download an array
 * of any type as an Excel file.
 *
 * It expects an array of strings (or XLSHeader objects) to use as the header,
 * and a function that can convert an array element to an `ExportDataRow`
 * object. The return value is a function that takes a filename and an array
 * of any type, and when called it triggers a download of that array.
 *
 * @param {Array<string | XLSHeader>} headers An array of strings or XLSHeader
 * objects to use for the Excel header.
 * @param {T => ExportDataRow} toExportableRowFn A function to convert an
 * array element to an exportable data row, which is an object that has one
 * key for each header.
 * @returns {(string, Array<T>) => void} A function that triggers the download.
 */
export default function useXLSDownload<T>(
  headers: $ReadOnlyArray<string | XLSHeader>,
  toExportableRowFn: T => ExportDataRow,
): (filename: string, data: $ReadOnlyArray<T>) => void {
  const downloadData = React.useCallback(
    (filename: string, dataRows: $ReadOnlyArray<T>) => {
      const csvHeader = headers.map(key =>
        typeof key === 'string' ? { key, label: key } : key,
      );

      exportToExcel(
        filename,
        csvHeader,
        dataRows.map(data => toExportableRowFn(data)),
      );
    },
    [headers, toExportableRowFn],
  );

  return downloadData;
}
