// @flow
import * as React from 'react';

import Tooltip from 'components/ui/Tooltip';
import UploadInput from 'components/ui/UploadInput';

type Props = {
  fileExtensions: string,
  handleFileUpload: File => void,

  // The tooltip text to display when the file upload is disabled. There will not be
  // a tooltip if `uploadDisabled` is false.
  tooltipText?: string | void,
  uploadDisabled?: boolean,
};

export default function FileInput({
  fileExtensions,
  handleFileUpload,
  tooltipText = undefined,
  uploadDisabled = false,
}: Props): React.Node {
  const fileDrop = (e: DragEvent): void => {
    if (e.dataTransfer) {
      const [file] = e.dataTransfer.files;
      handleFileUpload(file);
    }
  };

  const fileChange = (e: SyntheticEvent<HTMLInputElement>): void => {
    if (e.target instanceof HTMLInputElement) {
      const [file] = e.target.files;
      handleFileUpload(file);
    }
  };

  const fileInput = (
    <UploadInput
      accept={fileExtensions}
      className="data-upload-fileinput__upload-input"
      disabled={uploadDisabled}
      onChange={fileChange}
      onFileDrop={fileDrop}
    />
  );

  if (tooltipText && uploadDisabled) {
    return (
      <Tooltip
        content={tooltipText}
        targetClassName="data-upload-fileinput__tooltip"
      >
        {fileInput}
      </Tooltip>
    );
  }
  return fileInput;
}
