// @flow
import * as React from 'react';
import classNames from 'classnames';

import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import Toaster from 'components/ui/Toaster';

export function getSize(size: number): string {
  const sizeKb = 1024;
  const sizeMb = sizeKb * sizeKb;
  const sizeGb = sizeMb * sizeKb;
  const sizeTerra = sizeGb * sizeKb;

  if (size < sizeMb) {
    const calculatedSizeMb = Number((size / sizeKb).toFixed(0));
    if (calculatedSizeMb <= 0) {
      return `${size} B`;
    }
    return `${calculatedSizeMb} KB`;
  }
  if (size < sizeGb) {
    return `${(size / sizeMb).toFixed(0)} MB`;
  }
  if (size < sizeTerra) {
    return `${(size / sizeGb).toFixed(0)} GB`;
  }
  return '';
}

type Props = {
  /** Called when a file is dragged and dropped into component */
  accept?: string,

  className?: string,
  disabled?: boolean,
  label?: string,

  /** Called when a file is selected */
  onChange: (e: SyntheticEvent<HTMLInputElement>) => void,

  onFileDrop?: (e: DragEvent) => void,
};

/**
 * A simple Input to select a file from a local filesystem.
 */
export default function UploadInput({
  onChange,
  accept = '.csv',
  className = '',
  disabled = false,
  label = I18N.text('Drag and drop or click to select file'),
  onFileDrop = undefined,
}: Props): React.Node {
  const inputFileRef = React.createRef<HTMLInputElement>();
  const dropAreaRef = React.createRef<HTMLDivElement>();
  const [fileSelected, setFileSelected] = React.useState<Object>(null);

  const acceptedFileExts = accept.split(',');

  // Validate the file ending since the input `accept` parameter should only be used as a
  // suggestion.
  const validateCorrectFileType = (file: File): boolean => {
    if (
      acceptedFileExts.some(fileExt =>
        (fileExt.includes('/') && fileExt === file.type) ||
        file.name.endsWith(fileExt.trim().slice(-3)),
      )
    ) {
      return true;
    }
    Toaster.error(I18N.text('Upload Failed! Incorrect File Type'));
    return false;
  };

  const onFileSelected = (e: SyntheticEvent<HTMLInputElement>): void => {
    if (e.target instanceof HTMLInputElement) {
      const file = e.target.files[0];
      if (!validateCorrectFileType(file)) {
        return;
      }
      setFileSelected(file);
      onChange(e);
    }
  };

  const onClickDragArea = (): void => {
    if (inputFileRef.current) {
      inputFileRef.current.click();
    }
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    if (!disabled && e.dataTransfer && onFileDrop) {
      const file = e.dataTransfer.files[0];
      if (validateCorrectFileType(file)) {
        setFileSelected(file);
        onFileDrop(e);
      }
    }
  };

  const uploadIconClassName = classNames('zen-input-upload__upload-icon', {
    'zen-input-upload__upload-icon--disabled': disabled,
  });

  const selectedFileInfo = fileSelected ? (
    <Group.Vertical spacing="xs">
      <Group.Item>
        {fileSelected.name}
        <Icon style={{ paddingLeft: '10px' }} type="refresh" />
      </Group.Item>
      {getSize(fileSelected.size)}
    </Group.Vertical>
  ) : (
    <Group.Vertical spacing="xs">
      <Icon ariaHidden className={uploadIconClassName} type="svg-upload" />
      {label}
    </Group.Vertical>
  );

  const dragAreaClassName = classNames(
    'zen-input-upload__drag-area',
    'u-paragraph-text',
    {
      'zen-input-upload__drag-area--disabled': disabled,
    },
  );

  // NOTE: For some browers, the input accept parameter will filter files using only the
  // final extension. For example, if accept was given ".csv.gz", then all files would be grayed
  // out. This workaround is fine because we do additional validation on the file extension.
  const inputAcceptExtensions = acceptedFileExts
    .map(ext => {
      // There are two types of file type formats allowed. Types like "application/zip" and
      // extensions like ".csv.gz". The first type doesn't need this workaround, but the second
      // does.
      if (ext.includes('/')) {
        return ext;
      }
      return `.${ext.split('.').slice(-1)[0]}`;
    })
    .join(',');
  const roleProp = disabled ? {} : { role: 'button' };
  return (
    <div className={`zen-input-upload ${className}`}>
      <input
        ref={inputFileRef}
        accept={inputAcceptExtensions}
        aria-hidden="true"
        disabled={disabled}
        onChange={onFileSelected}
        style={{ display: 'none' }}
        type="file"
      />
      <div
        ref={dropAreaRef}
        aria-hidden="true"
        className={dragAreaClassName}
        data-testid="upload-input-box"
        onClick={onClickDragArea}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        {...roleProp}
      >
        {selectedFileInfo}
      </div>
    </div>
  );
}
