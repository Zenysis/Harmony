// @flow
import ZenArray from 'lib/Zen/ZenArray';
import { COLUMN_TYPE } from 'models/DataUploadApp/registry';
import type Moment from 'models/core/wip/DateTime/Moment';
import type { SerializedColumnSpec } from 'models/DataUploadApp/ColumnSpec';

export type ColumnType = $Keys<typeof COLUMN_TYPE>;

export const DATAPREP_TYPE = 'DATAPREP';
export const CSV_TYPE = 'CSV';
export type DataUploadSourceType = typeof DATAPREP_TYPE | typeof CSV_TYPE;

export type FilePreviewRow = { +[string]: string, ... };

export type FilePreview = $ReadOnlyArray<FilePreviewRow>;

export type DataFileUploadResponse = {
  columnMapping: $ReadOnlyArray<SerializedColumnSpec>,
  filePath: string,
  filePreview: FilePreview,
  lastModified: Date,
  sourceId: string,
};

export type ExistingDataFileResponse = {
  lastModified: Moment,
  userFileName: string,
};

// NOTE: For now, this response only validates that all the required headers
// are present in the correct order. In the future, it might do other validations,
// such as type checks.
export type DataprepValidationResponse = {
  extraHeaders: $ReadOnlyArray<string>,
  filePath: string,
  missingHeaders: $ReadOnlyArray<string>,
  orderCorrect: boolean,
};

export type SourceDateRanges = {
  [sourceId: string]: {
    endDate: string | null,
    startDate: string | null,
  },
};

export type FileValidationResponse = {
  responseData: {
    recommendationMessage: string,
    validationMessage: string,
    validationSummary: ZenArray<string>,
    validationTitle: string,
  },
  resultType: string
}
