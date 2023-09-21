// @flow
import * as React from 'react';
import Promise from 'bluebird';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import ColumnSpec from 'models/DataUploadApp/ColumnSpec';
import DataprepFileValidator from 'models/DataUploadApp/DataprepFileValidator';
import Moment from 'models/core/wip/DateTime/Moment';
import { COLUMN_TYPE } from 'models/DataUploadApp/registry';
import { CSV_TYPE, DATAPREP_TYPE } from 'models/DataUploadApp/types';
import { noop } from 'util/util';
import { relayIdToDatabaseNumberId } from 'util/graphql';
import { sortColumns } from 'components/DataUploadApp/util';
import type {
  ColumnType,
  DataUploadSourceType,
  ExistingDataFileResponse,
  FilePreview,
} from 'models/DataUploadApp/types';
import type { DataUploadSource } from 'components/DataUploadApp/SourceTable/ActionCell';
import type { DefaultValues as DataprepFileValidatorDefaultValues } from 'models/DataUploadApp/DataprepFileValidator';
import type { SerializedColumnSpec } from 'models/DataUploadApp/ColumnSpec';

/** ---------------------------------------------------------------------------
 * NOTE: $SingleInputSourceHack
 * Data Upload is an intermediate state where multiple input files for a single
 * source is supported only for dataprep sources and not yet for CSV sources.
 * This means the database tables have been updated to support that many-to-one
 * relationship. However, both dataprep and CSV sources share the same state
 * type for this context as well as a lot of other code. It doesn't make sense
 * to diverge them since that would require updating a lot of code and then
 * reverting it once that functionality is added for CSV sources. Instead, all
 * of the CSV specific code will take the first item in the fileSummaries list
 * since there can currently only ever be one file summary for a CSV source.
 * Anywhere this is done will include a comment with `$SingleInputSourceHack`
 * and an explanation of the necessary changes once CSV sources can have
 * multiple input files.
 * ------------------------------------------------------------------------- */

// A source can have multiple input files. Define the type of each input file.
export type FileSummaryState = {
  columnMapping: Zen.Map<ColumnSpec>,
  // NOTE: This can't be a ZenMap because the key type needs to be of type ColumnType
  columnOrder: { +[ColumnType]: $ReadOnlyArray<string> },
  filePath: string,
  filePreview: FilePreview,
  fileSummaryId: number | void,
  lastModified: Moment | void,
  userFileName: string,
};

/** This defines the type of the Data Upload Modal's global app state. */
export type DataUploadModalState = {
  allowMultipleFiles: boolean | void,
  dataprepExpectedColumns: $ReadOnlyArray<string> | void,
  // NOTE: Even though this only refers to a single file, it's not in
  // `fileSummaries` because only one file is ever being validated at once.
  dataprepFileValidator: DataprepFileValidator,
  // The file path is the key because it's guaranteed to be unique.
  fileSummaries: Zen.Map<FileSummaryState>,
  recipeId: number | void,
  sourceId: string,
  sourceName: string,
  sourceType: DataUploadSourceType,
  stateChanged: boolean,
};

function buildColumnOrder() {
  return {
    [COLUMN_TYPE.DATE]: [],
    [COLUMN_TYPE.DIMENSION]: [],
    [COLUMN_TYPE.FIELD]: [],
  };
}

// TODO: The fact that half of these properties are empty for a dataprep
// source means that we should probably have two file summary types (dataprep
// and CSV). However, this will all need to be refactored for end to end
// datapreps, so wait until then to do that refactor.
function buildNewDataprepFileSummary(
  filePath: string,
  userFileName: string,
  lastModified: Moment | void = undefined,
) {
  return {
    filePath,
    lastModified,
    userFileName,
    columnMapping: Zen.Map.create<ColumnSpec>(),
    columnOrder: buildColumnOrder(),
    filePreview: [],
    fileSummaryId: undefined,
  };
}

// NOTE: This requires that column names are unique.
// NOTE: These functions return a promise, which does not play well with useReducer,
// so they will have to be called before the dispatch is.
export function buildColumnStructures(
  columnList: $ReadOnlyArray<SerializedColumnSpec>,
): Promise<[Zen.Map<ColumnSpec>, { +[ColumnType]: $ReadOnlyArray<string> }]> {
  return Promise.all(
    columnList.map(serializedColumn =>
      ColumnSpec.deserializeAsync(serializedColumn),
    ),
  ).then(columns => {
    const columnMapping = {};
    const columnOrder = buildColumnOrder();
    // Build columnMapping and create lists for columnOrder
    columns.forEach(column => {
      columnMapping[column.name()] = column;
      columnOrder[column.columnType()].push(column.name());
    });
    // Sort columnOrder alphabetically by canonical name
    Object.keys(columnOrder).forEach(columnType => {
      columnOrder[columnType].sort((columnName1, columnName2) =>
        sortColumns(columnMapping[columnName1], columnMapping[columnName2]),
      );
    });

    return [Zen.Map.create<ColumnSpec>(columnMapping), columnOrder];
  });
}

function initializeState(
  initialSelfServeSource: DataUploadSource | void,
  columnMapping: Zen.Map<ColumnSpec>,
  columnOrder: { +[ColumnType]: $ReadOnlyArray<string> },
): DataUploadModalState {
  const fileSummaries = {};
  if (initialSelfServeSource) {
    initialSelfServeSource.dataUploadFileSummaries.forEach(fileSummary => {
      fileSummaries[fileSummary.filePath] = {
        columnMapping,
        columnOrder,
        filePath: fileSummary.filePath,
        filePreview: [],
        fileSummaryId: relayIdToDatabaseNumberId(fileSummary.id),
        lastModified: Moment.utc(fileSummary.lastModified).local(),
        userFileName: fileSummary.userFileName,
      };
    });
  }

  return {
    allowMultipleFiles: initialSelfServeSource?.dataprepFlow?.appendable,
    dataprepExpectedColumns:
      initialSelfServeSource?.dataprepFlow?.expectedColumns || undefined,
    dataprepFileValidator: DataprepFileValidator.create({}),
    fileSummaries: Zen.Map.create<FileSummaryState>(fileSummaries),
    recipeId: initialSelfServeSource?.dataprepFlow?.recipeId,
    sourceId: initialSelfServeSource?.sourceId || '',
    sourceName: initialSelfServeSource?.pipelineDatasource.name || '',
    sourceType:
      initialSelfServeSource && initialSelfServeSource.dataprepFlow
        ? DATAPREP_TYPE
        : CSV_TYPE,
    stateChanged: false,
  };
}

/** This defines the type of actions that the reducer can accept */
type DataUploadModalAction =
  /** Initializes the source */
  | {
      columnMapping: Zen.Map<ColumnSpec>,
      columnOrder: { +[ColumnType]: $ReadOnlyArray<string> },
      initialSelfServeSource: DataUploadSource | void,
      type: 'INITIALIZE',
    }

  /** Sets the source name */
  | { sourceName: string, type: 'SOURCE_NAME_CHANGE' }

  /** Unlinks an existing file from the source */
  | {
      filePathToDelete: string,
      type: 'DELETE_FILE',
    }

  /**
   * For a newly uploaded file, sets the file path, file preview, column mapping, and column
   * order. Expects the column mapping and order to be already built. If this is a new source,
   * the first file upload will set the sourceId and prevent it from changing in the future.
   */
  | {
      columnMapping: Zen.Map<ColumnSpec>,
      columnOrder: { +[ColumnType]: $ReadOnlyArray<string> },
      filePath: string,
      filePreview: FilePreview,
      sourceId: string,
      type: 'FILE_UPLOAD',
      userFileName: string,
    }

  /** Updates a column spec in the columnMapping */
  | {
      columnName: string,
      columnSpec: ColumnSpec,
      type: 'COLUMN_SPEC_CHANGE',
      typeChanged: boolean,
    }

  /** Updates the file preview. */
  | {
      filePreview: FilePreview,
      type: 'SET_FILE_PREVIEW',
    }

  /**
   * Updates after a dataprep file is validated, including the missing headers and
   * user filename.
   */
  | {
      ...DataprepFileValidatorDefaultValues,
      filePath: string,
      type: 'DATAPREP_INPUT_VALIDATION',
      userFileName: string,
    }

  /**
   * Sets the source type and re-initializes the source.
   */
  | {
      sourceType: DataUploadSourceType,
      type: 'SOURCE_TYPE_CHANGE',
    }

  /**
   * Sets the corresponding source id for a dataprep source. Updates the name as well.
   */
  | {
      sourceId: string,
      sourceName: string,
      type: 'SET_DATAPREP_SOURCE',
    }

  /**
   * Sets the recipe id for a dataprep source.
   */
  | {
      recipeId: number | void,
      type: 'RECIPE_ID_CHANGE',
    }

  /**
   * Updates after a new dataprep setup is validated, setting whether or not
   * the flow is appendable, expected columns for input file(s), and uploaded file(s).
   */
  | {
      allowMultipleFiles: boolean,
      dataprepExpectedColumns: $ReadOnlyArray<string>,
      type: 'DATAPREP_SETUP_VALIDATION',
      uploadedFiles: $ReadOnlyArray<ExistingDataFileResponse>,
    }

  /**
   * Clears dataprep validation headers to be empty.
   */
  | {
      type: 'RESET_DATAPREP_HEADERS',
    };

/** This defines the actions that can be performed on the state */
export function dataUploadModalReducer(
  state: DataUploadModalState,
  action: DataUploadModalAction,
): DataUploadModalState {
  switch (action.type) {
    case 'INITIALIZE': {
      const { columnMapping, columnOrder, initialSelfServeSource } = action;
      return initializeState(
        initialSelfServeSource,
        columnMapping,
        columnOrder,
      );
    }
    case 'SOURCE_NAME_CHANGE': {
      const { sourceName } = action;
      return {
        ...state,
        sourceName,
        stateChanged: true,
      };
    }
    case 'DELETE_FILE': {
      const { fileSummaries } = state;
      const { filePathToDelete } = action;
      return {
        ...state,
        fileSummaries: fileSummaries.delete(filePathToDelete),
        stateChanged: true,
      };
    }
    case 'FILE_UPLOAD': {
      const { fileSummaries } = state;
      const {
        columnMapping,
        columnOrder,
        filePath,
        filePreview,
        sourceId,
        userFileName,
      } = action;
      return {
        ...state,
        sourceId,
        fileSummaries: fileSummaries.set(filePath, {
          columnMapping,
          columnOrder,
          filePath,
          filePreview,
          userFileName,
          fileSummaryId: undefined,
          lastModified: undefined,
        }),
        stateChanged: true,
      };
    }
    case 'COLUMN_SPEC_CHANGE': {
      // $SingleInputSourceHack: This will need to pass in which fileSummary
      // is being updated.
      const { fileSummaries } = state;
      invariant(
        fileSummaries.size() === 1,
        'CSV source has multiple file summaries',
      );
      const fileSummary = fileSummaries.values()[0];

      const { columnMapping, columnOrder } = fileSummary;
      const { columnName, columnSpec, typeChanged } = action;
      let newColumnOrder = columnOrder;
      if (typeChanged) {
        const oldColumnType = columnMapping.forceGet(columnName).columnType();
        const newColumnType = columnSpec.columnType();
        newColumnOrder = {
          ...columnOrder,
        };
        // remove the column from the old type ordering array
        newColumnOrder[oldColumnType] = columnOrder[oldColumnType].filter(
          name => columnName !== name,
        );
        // add the column to the new type ordering array
        newColumnOrder[newColumnType] = [columnName].concat(
          columnOrder[newColumnType],
        );
      }
      return {
        ...state,
        fileSummaries: fileSummaries.set(fileSummary.filePath, {
          ...fileSummary,
          columnMapping: columnMapping.set(columnName, columnSpec),
          columnOrder: newColumnOrder,
        }),
        stateChanged: true,
      };
    }
    case 'SET_FILE_PREVIEW': {
      // $SingleInputSourceHack: This will need to pass in which fileSummary
      // is being updated.
      const { fileSummaries } = state;
      invariant(
        fileSummaries.size() === 1,
        'CSV source has multiple file summaries',
      );
      const fileSummary = fileSummaries.values()[0];

      const { filePreview } = action;
      return {
        ...state,
        fileSummaries: fileSummaries.set(fileSummary.filePath, {
          ...fileSummary,
          filePreview,
        }),
      };
    }
    case 'DATAPREP_INPUT_VALIDATION': {
      const { fileSummaries } = state;
      const {
        extraHeaders,
        filePath,
        headerOrderCorrect,
        missingHeaders,
        userFileName,
      } = action;
      const dataprepFileValidator = DataprepFileValidator.create({
        extraHeaders,
        headerOrderCorrect,
        missingHeaders,
      });
      invariant(
        !(dataprepFileValidator.fileValid() && fileSummaries.has(filePath)),
        'Duplicate file path added for dataprep',
      );

      // Only update file summaries if the file passed the validation checks
      const newFileSummaries = dataprepFileValidator.fileValid()
        ? fileSummaries.set(
            filePath,
            buildNewDataprepFileSummary(filePath, userFileName),
          )
        : fileSummaries;

      return {
        ...state,
        dataprepFileValidator,
        fileSummaries: newFileSummaries,
        stateChanged: true,
      };
    }
    case 'SOURCE_TYPE_CHANGE': {
      const { sourceType } = action;
      return {
        ...initializeState(
          undefined,
          Zen.Map.create<ColumnSpec>(),
          buildColumnOrder(),
        ),
        sourceType,
        stateChanged: true,
      };
    }
    case 'SET_DATAPREP_SOURCE': {
      const { sourceId, sourceName } = action;
      return {
        ...state,
        sourceId,
        sourceName,
        allowMultipleFiles: undefined,
        dataprepExpectedColumns: undefined,
        fileSummaries: Zen.Map.create<FileSummaryState>({}),
        stateChanged: true,
      };
    }
    case 'RECIPE_ID_CHANGE': {
      const { recipeId } = action;
      return {
        ...state,
        recipeId,
        allowMultipleFiles: undefined,
        dataprepExpectedColumns: undefined,
        fileSummaries: Zen.Map.create<FileSummaryState>({}),
        stateChanged: true,
      };
    }
    case 'DATAPREP_SETUP_VALIDATION': {
      const { fileSummaries } = state;
      const {
        allowMultipleFiles,
        dataprepExpectedColumns,
        uploadedFiles,
      } = action;

      let updatedFileSummaries = fileSummaries;
      uploadedFiles.forEach(fileSummary => {
        updatedFileSummaries = updatedFileSummaries.set(
          fileSummary.userFileName,
          buildNewDataprepFileSummary(
            fileSummary.userFileName,
            fileSummary.userFileName,
            fileSummary.lastModified,
          ),
        );
      });

      return {
        ...state,
        allowMultipleFiles,
        dataprepExpectedColumns,
        fileSummaries: updatedFileSummaries,
        stateChanged: true,
      };
    }

    case 'RESET_DATAPREP_HEADERS':
      return {
        ...state,
        dataprepFileValidator: DataprepFileValidator.create({}),
      };
    default:
      (action.type: empty);
      return state;
  }
}

export const defaultModalState: DataUploadModalState = {
  allowMultipleFiles: false,
  dataprepExpectedColumns: undefined,
  dataprepFileValidator: DataprepFileValidator.create({}),
  fileSummaries: Zen.Map.create<FileSummaryState>(),
  recipeId: undefined,
  sourceId: '',
  sourceName: '',
  sourceType: 'CSV',
  stateChanged: false,
};

/**
 * This custom hook is responsible for holding and updating the Data Upload
 * Modal's global state.
 */
export default function useDataUploadModalContext(): [
  DataUploadModalState,
  (DataUploadModalAction) => void,
] {
  const [state, dispatch] = React.useReducer(
    dataUploadModalReducer,
    defaultModalState,
  );

  return [state, dispatch];
}

/**
 * This context holds the state representing the editable fields in a DataUploadSource object
 * and is shared among the AddDataModal component hierarchy.
 */
export const DataUploadModalContext: React.Context<DataUploadModalState> = React.createContext(
  defaultModalState,
);
/**
 * This dispatch holds the functions to update the DataUploadModalContext and is shared among the
 * AddDataModal component hierarchy.
 */
export const DataUploadModalDispatch: React.Context<
  $Dispatch<DataUploadModalAction>,
> = React.createContext(noop);
