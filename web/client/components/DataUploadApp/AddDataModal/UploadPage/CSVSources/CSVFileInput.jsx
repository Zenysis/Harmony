// @flow
import * as React from 'react';

import DataUploadService from 'services/DataUploadService';
import FileInput from 'components/DataUploadApp/AddDataModal/UploadPage/FileInput';
import I18N from 'lib/I18N';
import Toaster from 'components/ui/Toaster';
import usePromiseCleanUp from 'lib/hooks/usePromiseCleanUp';
import {
  DataUploadModalContext,
  DataUploadModalDispatch,
  buildColumnStructures,
} from 'components/DataUploadApp/AddDataModal/useDataUploadModalContext';
import { slugify } from 'util/stringUtil';
import type { DataFileUploadResponse } from 'models/DataUploadApp/types';

type Props = {
  existingDataUploadSources: $ReadOnlySet<string>,
  existingSource: boolean,
  setLastFileUploaded: ({
    filePath: string,
    isNewFile: boolean,
    userFileName: string,
  }) => void,
  setLoading: boolean => void,
};

export default function CSVFileInput({
  existingDataUploadSources,
  existingSource,
  setLastFileUploaded,
  setLoading,
}: Props): React.Node {
  const { sourceId, sourceName } = React.useContext(DataUploadModalContext);
  const dispatch = React.useContext(DataUploadModalDispatch);

  const setPromise = usePromiseCleanUp();
  // If this is a new source, then we need the sourceName to be defined to create the sourceId.
  // This is because the uploaded file is stored in a folder named for the sourceId.
  const disableUploadInput = !existingSource && !sourceName;

  const getSourceId = `self_serve_${slugify(sourceName, '_')}`;

  const makeUploadCall = (newSourceId: string, file: File) => {
    setLoading(true);
    setPromise(
      DataUploadService.uploadDataFile(newSourceId, file)
        .then((dataFileUploadResponse: DataFileUploadResponse) => {
          buildColumnStructures(dataFileUploadResponse.columnMapping).then(
            ([columnMapping, columnOrder]) => {
              setLoading(false);
              setLastFileUploaded({
                filePath: dataFileUploadResponse.filePath,
                isNewFile: true,
                userFileName: file.name,
              });
              dispatch({
                columnMapping,
                columnOrder,
                filePath: dataFileUploadResponse.filePath,
                filePreview: dataFileUploadResponse.filePreview,
                sourceId: newSourceId,
                type: 'FILE_UPLOAD',
                userFileName: file.name,
              });
            },
          );
        })
        .catch(error => {
          Toaster.error(
            I18N.text('Upload Failed! %(errorMessage)s', {
              errorMessage: error.message,
            }),
          );
          setLoading(false);
        }),
    );
  };

  const handleFileUpload = (file: File) => {
    // A sourceId is "frozen" once the source has been created. So if it's a new source,
    // then get the sourceId from the source name.
    if (existingSource) {
      makeUploadCall(sourceId, file);
    } else {
      makeUploadCall(getSourceId, file);
    }
  };

  const checkSourceName = (event: SyntheticMouseEvent<HTMLDivElement>) => {
    if (!existingSource && existingDataUploadSources.has(getSourceId)) {
      event.stopPropagation();
      Toaster.error(
        I18N.text(
          'A self serve source already exists with that name.',
          'selfServeSourceExists',
        ),
      );
    }
  };

  return (
    // Use onClickCapture and onDropCapture to file upload event before it reaches
    // UploadInput
    <div
      onClickCapture={checkSourceName}
      onDropCapture={checkSourceName}
      role="button"
    >
      <FileInput
        fileExtensions=".csv,.csv.gz"
        handleFileUpload={handleFileUpload}
        tooltipText={I18N.text('Set data source name before uploading file')}
        uploadDisabled={disableUploadInput}
      />
    </div>
  );
}
