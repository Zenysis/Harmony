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
} from 'components/DataUploadApp/AddDataModal/useDataUploadModalContext';
import type { DataprepValidationResponse } from 'models/DataUploadApp/types';

type Props = {
  fileExtension: string,
  setLastFileUploaded: ({
    filePath: string,
    isNewFile: boolean,
    userFileName: string,
  }) => void,
  setLoading: boolean => void,
};

export default function DataprepFileInput({
  fileExtension,
  setLastFileUploaded,
  setLoading,
}: Props): React.Node {
  const { sourceId } = React.useContext(DataUploadModalContext);
  const dispatch = React.useContext(DataUploadModalDispatch);

  const setPromise = usePromiseCleanUp();

  const makeUploadCall = (file: File) => {
    setLoading(true);
    setPromise(
      DataUploadService.validateDataprepUpload(sourceId, file)
        .then((dataprepValidation: DataprepValidationResponse) => {
          setLoading(false);
          setLastFileUploaded({
            filePath: dataprepValidation.filePath,
            isNewFile: true,
            userFileName: file.name,
          });
          dispatch({
            extraHeaders: dataprepValidation.extraHeaders,
            filePath: dataprepValidation.filePath,
            headerOrderCorrect: dataprepValidation.orderCorrect,
            missingHeaders: dataprepValidation.missingHeaders,
            type: 'DATAPREP_INPUT_VALIDATION',
            userFileName: file.name,
          });
        })
        .catch(error => {
          Toaster.error(
            I18N.textById('Upload Failed! %(errorMessage)s', {
              errorMessage: error.message,
            }),
          );
          setLoading(false);
        }),
    );
  };

  return (
    <FileInput
      fileExtensions={fileExtension}
      handleFileUpload={makeUploadCall}
    />
  );
}
