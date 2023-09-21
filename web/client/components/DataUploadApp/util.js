// @flow
import I18N from 'lib/I18N';
import { COLUMN_TYPE } from 'models/DataUploadApp/registry';
import type ColumnSpec from 'models/DataUploadApp/ColumnSpec';
import type { ColumnType } from 'models/DataUploadApp/types';

function areDuplicateMatches(unignoredColumns): boolean {
  const matches = unignoredColumns
    .map(columnSpec => columnSpec.match())
    .filter(Boolean);
  return new Set(matches).size !== matches.length;
}

// For a group of columns of one type, return the appropriate message if there are any errors on
// the whole group. This does not check if any individual columns have errors.
export function getTypeSpecificError(
  type: ColumnType,
  unignoredColumns: $ReadOnlyArray<ColumnSpec>,
): string | null {
  const numberUnignoredColumns = unignoredColumns.length;
  switch (type) {
    case COLUMN_TYPE.DATE:
      if (numberUnignoredColumns === 0) {
        return I18N.text('Date column required');
      }
      if (numberUnignoredColumns > 1) {
        return I18N.text('Only 1 date column allowed');
      }
      break;
    case COLUMN_TYPE.FIELD:
      // TODO: Do we want to throw an error for multiple fields matching the same
      // field id (especially since with slugifying this could be unexpected for new fields)?
      // It's not an "error", but will cause the columns to be summed (which may be unexpected
      // to the user). Could also just show this in the preview page.
      if (numberUnignoredColumns === 0) {
        return I18N.text('At least 1 indicator required');
      }
      break;
    case COLUMN_TYPE.DIMENSION:
      if (numberUnignoredColumns === 0) {
        return I18N.text('At least 1 group by required');
      }
      if (areDuplicateMatches(unignoredColumns)) {
        return I18N.text('Duplicate match');
      }
      break;
    default:
      return null;
  }
  return null;
}

// Given two columns, sort them alphabetically by canonical name
export function sortColumns(column1: ColumnSpec, column2: ColumnSpec): number {
  const label1 = column1.canonicalName();
  const label2 = column2.canonicalName();
  return label1.localeCompare(label2);
}

// Return all extensions, ex. "test.csv.gz" -> ".csv.gz"
export function getFileExtension(filename: string): string {
  return filename.substring(filename.indexOf('.'));
}

// Hardcoded URL to the dataprep job
export function getDataprepJobLink(jobId: number, projectId: string): string {
  // TODO URL should include projectId as well.
  return `https://clouddataprep.com/jobs/${jobId}?projectId=${projectId}`;
}
