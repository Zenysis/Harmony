// @flow
import * as React from 'react';
import classNames from 'classnames';

import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';

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
  /** Called when a file is selected */
  onChange: (e: SyntheticEvent<HTMLInputElement>) => void,

  /** Called when a file is dragged and dropped into component */
  accept?: string,
  className?: string,
  disabled?: boolean,
  label?: string,
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

  const onFileSelected = (e: SyntheticEvent<HTMLInputElement>): void => {
    if (e.target instanceof HTMLInputElement) {
      setFileSelected(e.target.files[0]);
    }
    onChange(e);
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
      setFileSelected(e.dataTransfer.files[0]);
      onFileDrop(e);
    }
  };

  const uploadIconClassName = classNames('zen-input-upload__upload-icon', {
    'zen-input-upload__upload-icon--disabled': disabled,
  });

  const selectedFileInfo = fileSelected ? (
    <Group.Vertical spacing="xs">
      <Group.Item>
        {fileSelected.name}
        <Icon type="refresh" style={{ paddingLeft: '10px' }} />
      </Group.Item>
      {getSize(fileSelected.size)}
    </Group.Vertical>
  ) : (
    <Group.Vertical spacing="xs">
      <Icon type="svg-upload" ariaHidden className={uploadIconClassName} />
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

  const roleProp = disabled ? {} : { role: 'button' };

  return (
    <div className={`zen-input-upload ${className}`}>
      <input
        type="file"
        accept={accept}
        ref={inputFileRef}
        onChange={onFileSelected}
        style={{ display: 'none' }}
        aria-hidden="true"
        disabled={disabled}
      />
      <div
        ref={dropAreaRef}
        className={dragAreaClassName}
        onClick={onClickDragArea}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        aria-hidden="true"
        {...roleProp}
      >
        {selectedFileInfo}
      </div>
    </div>
  );
}
