// @flow
import * as React from 'react';

import BaseRowDescription from 'components/DataUploadApp/AddDataModal/UploadPage/CSVSources/BaseRowDescription';
import CSVFileInput from 'components/DataUploadApp/AddDataModal/UploadPage/CSVSources/CSVFileInput';
import DataprepDescription from 'components/DataUploadApp/AddDataModal/UploadPage/DataprepSources/DataprepDescription';
import DataprepFileInput from 'components/DataUploadApp/AddDataModal/UploadPage/DataprepSources/DataprepFileInput';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import UploadedFile from 'components/DataUploadApp/AddDataModal/UploadPage/UploadedFile';
import { CSV_TYPE } from 'models/DataUploadApp/types';
import {
  DataUploadModalContext,
  DataUploadModalDispatch,
} from 'components/DataUploadApp/AddDataModal/useDataUploadModalContext';

type Props = {
  existingDataUploadSources: $ReadOnlySet<string>,
  existingSource: boolean,
  fileExtension: string,
};

export default function FileUploadBlock({
  existingDataUploadSources,
  existingSource,
  fileExtension,
}: Props): React.Node {
  const { allowMultipleFiles, fileSummaries, sourceType } = React.useContext(
    DataUploadModalContext,
  );
  const dispatch = React.useContext(DataUploadModalDispatch);

  const [fileLoading, setFileLoading] = React.useState<boolean>(false);
  // Controls whether the green file upload success box is visible. If so, stores the filePath
  // userFileName for the last file uploaded to display. On page load, this should only be
  // populated for non-appendable sources that have a stored file.
  const [lastFileUploaded, setLastFileUploaded] = React.useState<{
    filePath: string,
    isNewFile: boolean,
    userFileName: string,
  } | void>(
    !allowMultipleFiles && fileSummaries.size() === 1
      ? {
          filePath: fileSummaries.values()[0].filePath,
          isNewFile: !fileSummaries.values()[0].fileSummaryId,
          userFileName: fileSummaries.values()[0].userFileName,
        }
      : undefined,
  );

  const description =
    sourceType === CSV_TYPE ? <BaseRowDescription /> : <DataprepDescription />;

  let fileInput;
  let captionText;
  if (sourceType === CSV_TYPE) {
    fileInput = (
      <CSVFileInput
        existingDataUploadSources={existingDataUploadSources}
        existingSource={existingSource}
        setLastFileUploaded={setLastFileUploaded}
        setLoading={setFileLoading}
      />
    );
    captionText = I18N.text(
      'only .csv or .csv.gz files accepted',
      'only-csv-accepted',
    );
  } else {
    fileInput = (
      <DataprepFileInput
        fileExtension={fileExtension}
        setLastFileUploaded={setLastFileUploaded}
        setLoading={setFileLoading}
      />
    );
    captionText = I18N.text(
      'File must match existing file type: %(extension)s',
      'file-match-extension',
      { extension: fileExtension },
    );
  }
  if (fileLoading) {
    // NOTE: This overwrites the above fileInput, which was done so the captionText would
    // be set to the correct value.
    fileInput = (
      <Group.Item
        alignItems="center"
        className="data-upload-fileinput__upload-input"
        flex
        justifyContent="center"
      >
        <LoadingSpinner />
      </Group.Item>
    );
  }

  const renderFileInputBlock = () => {
    if (lastFileUploaded) {
      const { filePath, isNewFile, userFileName } = lastFileUploaded;
      return (
        <UploadedFile
          fileInfo={isNewFile ? undefined : { filePath, userFileName }}
          onFileDelete={() => {
            setLastFileUploaded(undefined);
            if (!allowMultipleFiles) {
              dispatch({
                filePathToDelete: lastFileUploaded.filePath,
                type: 'DELETE_FILE',
              });
            }
          }}
          text={lastFileUploaded.userFileName}
        />
      );
    }
    return (
      <Group.Horizontal
        className="data-upload-fileinput"
        firstItemFlexValue={1}
        flex
        padding="l"
        spacing="l"
      >
        <Group.Vertical spacing="xs">
          {fileInput}
          <Group.Item className="data-upload-fileinput__caption-text">
            {captionText}
          </Group.Item>
        </Group.Vertical>
        {description}
      </Group.Horizontal>
    );
  };

  if (allowMultipleFiles) {
    return (
      <Group.Vertical spacing="m">
        <Heading.Small>
          <I18N>Upload New File</I18N>
        </Heading.Small>
        {renderFileInputBlock()}
      </Group.Vertical>
    );
  }
  return renderFileInputBlock();
}
