// @flow
import buildFilename from 'components/QueryResult/QueryResultActionButtons/ExportButton/buildFilename';

import { fieldIdsToName } from 'indicator_fields';

const TEXT = t('QueryApp.ExportButton.exportToJSON');

export default function exportToJSON(
  blob: Blob,
  format: string,
  field: string,
): void {
  // Create filename - Date followed by first indicator minus illegal chars.
  const filename = buildFilename(fieldIdsToName[field], format);

  if (window.navigator.msSaveBlob) {
    // IE 10+
    window.navigator.msSaveBlob(blob, filename);
  } else {
    const link = document.createElement('a');
    if (link.download === undefined) {
      window.toastr.error(TEXT.browserNotSupported);
      analytics.track('Export to Excel failed');
      return;
    }

    // Browsers that support HTML5 download attribute.
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    if (document.body) {
      document.body.appendChild(link);
    }
    link.click();
    if (document.body) {
      document.body.removeChild(link);
    }
  }
}
