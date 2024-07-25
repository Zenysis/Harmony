// @flow
import * as Zen from 'lib/Zen';
import ColumnSpec from 'models/DataUploadApp/ColumnSpec';
import Moment from 'models/core/wip/DateTime/Moment';
import ZenHTTPError, { HTTP_STATUS_CODE } from 'util/ZenHTTPError';
import { COLUMN_TYPE } from 'models/DataUploadApp/registry';
import { CSV_TYPE, DATAPREP_TYPE } from 'models/DataUploadApp/types';
import { defaultModalState } from 'components/DataUploadApp/AddDataModal/useDataUploadModalContext';
import type { DataFileUploadResponse } from 'models/DataUploadApp/types';
import type {
  DataUploadModalState,
  FileSummaryState,
} from 'components/DataUploadApp/AddDataModal/useDataUploadModalContext';
import type { DataUploadSource } from 'components/DataUploadApp/SourceTable/ActionCell';

export const FILE_PATH = 'file_path.csv.gz';
export const USER_FILE_NAME = 'file_name.csv';
export const MOCK_SOURCE_NAME = 'Test name';
export const MOCK_SOURCE_ID = 'test_name';
export const MOCK_SOURCE_NAME_2 = 'Test name 2';
export const MOCK_SOURCE_ID_2 = 'test_name_2';

export const MOCK_SOURCE_NODE = {
  node: {
    id: MOCK_SOURCE_ID,
    name: MOCK_SOURCE_NAME,
  },
};

export const MOCK_SOURCE_NODE_2 = {
  node: {
    id: MOCK_SOURCE_ID_2,
    name: MOCK_SOURCE_NAME_2,
  },
};

export const MOCK_RECIPE_VALIDATION_ERROR: ZenHTTPError = new ZenHTTPError(
  'nonexistentRecipeIdError',
  HTTP_STATUS_CODE.BAD_REQUEST,
);

export const MOCK_NOT_LAST_VALIDATION_ERROR: ZenHTTPError = new ZenHTTPError(
  'incorrectRecipeIDSelectedError',
  HTTP_STATUS_CODE.BAD_REQUEST,
);

export const MOCK_MISSING_BUCKET_VALIDATION_ERROR: ZenHTTPError = new ZenHTTPError(
  'bucketPathDoesNotExistError',
  HTTP_STATUS_CODE.BAD_REQUEST,
);

const filePreview = [
  { date: '2021-03-01', testDimension: 'groupby 1', testField: '4' },
];

export const CSV_SOURCE: DataUploadModalState = {
  ...defaultModalState,
  fileSummaries: Zen.Map.create<FileSummaryState>({
    [FILE_PATH]: {
      filePreview,
      columnMapping: new Zen.Map({
        date: ColumnSpec.create({
          canonicalName: 'Date',
          columnType: COLUMN_TYPE.DATE,
          datatype: 'datetime',
          ignoreColumn: false,
          isNewColumn: false,
          match: undefined,
          name: 'date',
        }),
        testDimension: ColumnSpec.create({
          canonicalName: 'Test Canonical Name',
          columnType: COLUMN_TYPE.DIMENSION,
          datatype: 'string',
          ignoreColumn: false,
          isNewColumn: false,
          match: 'TestCanonical',
          name: 'testDimension',
        }),
        testField: ColumnSpec.create({
          canonicalName: 'testField',
          columnType: COLUMN_TYPE.FIELD,
          datatype: 'number',
          ignoreColumn: false,
          isNewColumn: true,
          match: undefined,
          name: 'testField',
        }),
      }),
      columnOrder: {
        [COLUMN_TYPE.DATE]: ['date'],
        [COLUMN_TYPE.DIMENSION]: ['testDimension'],
        [COLUMN_TYPE.FIELD]: ['testField'],
      },
      filePath: FILE_PATH,
      fileSummaryId: 1,
      lastModified: new Moment(),
      userFileName: USER_FILE_NAME,
    },
  }),
  sourceId: MOCK_SOURCE_ID,
  sourceName: MOCK_SOURCE_NAME,
  sourceType: CSV_TYPE,
  stateChanged: true,
};

export const DATAPREP_NON_APPENDABLE_SOURCE: DataUploadModalState = {
  ...defaultModalState,
  allowMultipleFiles: false,
  dataprepExpectedColumns: ['date', 'testDimension', 'testField'],
  fileSummaries: Zen.Map.create<FileSummaryState>({
    [FILE_PATH]: {
      columnMapping: new Zen.Map(),
      columnOrder: {
        [COLUMN_TYPE.DATE]: [],
        [COLUMN_TYPE.DIMENSION]: [],
        [COLUMN_TYPE.FIELD]: [],
      },
      filePath: FILE_PATH,
      filePreview: [],
      fileSummaryId: 1,
      lastModified: new Moment(),
      userFileName: USER_FILE_NAME,
    },
  }),
  recipeId: 1,
  sourceId: MOCK_SOURCE_ID,
  sourceName: MOCK_SOURCE_NAME,
  sourceType: DATAPREP_TYPE,
  stateChanged: true,
};

export const DATAPREP_APPENDABLE_SOURCE: DataUploadModalState = {
  ...defaultModalState,
  allowMultipleFiles: true,
  dataprepExpectedColumns: ['date', 'testDimension', 'testField'],
  fileSummaries: Zen.Map.create<FileSummaryState>({
    [FILE_PATH]: {
      columnMapping: new Zen.Map(),
      columnOrder: {
        [COLUMN_TYPE.DATE]: [],
        [COLUMN_TYPE.DIMENSION]: [],
        [COLUMN_TYPE.FIELD]: [],
      },
      filePath: FILE_PATH,
      filePreview: [],
      fileSummaryId: 1,
      lastModified: Moment.create('2022-11-04'),
      userFileName: USER_FILE_NAME,
    },
    'file_path2.csv.gz': {
      columnMapping: new Zen.Map(),
      columnOrder: {
        [COLUMN_TYPE.DATE]: [],
        [COLUMN_TYPE.DIMENSION]: [],
        [COLUMN_TYPE.FIELD]: [],
      },
      filePath: 'file_path2.csv.gz',
      filePreview: [],
      fileSummaryId: 2,
      lastModified: Moment.create('2022-11-07'),
      userFileName: 'file_name2.csv',
    },
  }),
  recipeId: 1,
  sourceId: MOCK_SOURCE_ID,
  sourceName: MOCK_SOURCE_NAME,
  sourceType: DATAPREP_TYPE,
  stateChanged: true,
};

const columnMapping = [
  {
    columnType: COLUMN_TYPE.DATE,
    datatype: 'datetime',
    ignoreColumn: false,
    match: null,
    name: 'date',
  },
  {
    columnType: COLUMN_TYPE.DIMENSION,
    datatype: 'string',
    ignoreColumn: false,
    match: 'TestCanonical',
    name: 'testDimension',
  },
  {
    columnType: COLUMN_TYPE.FIELD,
    datatype: 'number',
    ignoreColumn: false,
    match: null,
    name: 'testField',
  },
];
export const FILE_UPLOAD_RESPONSE: string => DataFileUploadResponse = fileName => ({
  columnMapping,
  filePreview,
  filePath: fileName,
  lastModified: new Date(),
  sourceId: MOCK_SOURCE_ID,
});

export const CSV_DATA_UPLOAD_SOURCE: DataUploadSource = {
  // See other hack, still working on jest & graphQL
  // $FlowExpectedError[incompatible-type]
  $refType: null,
  dataUploadFileSummaries: [
    {
      columnMapping,
      filePath: FILE_PATH,
      id: '',
      lastModified: '2022-10-28',
      userFileName: USER_FILE_NAME,
    },
  ],
  dataprepFlow: undefined,
  id: '',
  latestFileSummary: [{ lastModified: '2022-10-28' }],
  pipelineDatasource: { name: MOCK_SOURCE_NAME },
  sourceId: MOCK_SOURCE_ID,
  sourceLastModified: '2022-10-28',
};

export const DATAPREP_DATA_UPLOAD_SOURCE: DataUploadSource = {
  // See other hack, still working on jest & graphQL
  // $FlowExpectedError[incompatible-type]
  $refType: null,
  dataUploadFileSummaries: [
    {
      columnMapping: [],
      filePath: FILE_PATH,
      id: '',
      lastModified: '2022-10-28',
      userFileName: USER_FILE_NAME,
    },
  ],
  dataprepFlow: {
    appendable: false,
    dataprepJobs: [{ jobId: 1, status: 'Complete' }],
    expectedColumns: ['date', 'testDimension', 'testField'],
    id: '',
    recipeId: 1,
  },
  id: '',
  latestFileSummary: [{ lastModified: '2022-10-28' }],
  pipelineDatasource: { name: MOCK_SOURCE_NAME },
  sourceId: MOCK_SOURCE_ID,
  sourceLastModified: '2022-10-28',
};
