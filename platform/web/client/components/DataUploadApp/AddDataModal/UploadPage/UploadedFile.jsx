// @flow
import * as React from 'react';
import invariant from 'invariant';

import Button from 'components/ui/Button';
import DataUploadService from 'services/DataUploadService';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import LabelWrapper from 'components/ui/LabelWrapper';
import Toaster from 'components/ui/Toaster';
import { DATAPREP_TYPE } from 'models/DataUploadApp/types';
import { DataUploadModalContext } from 'components/DataUploadApp/AddDataModal/useDataUploadModalContext';

type Props = {
  fileInfo: { filePath: string, userFileName: string } | void,
  onFileDelete: () => void,
  text: string,
};

export default function UploadedFile({
  fileInfo,
  onFileDelete,
  text,
}: Props): React.Node {
  const { allowMultipleFiles, sourceId, sourceType } = React.useContext(
    DataUploadModalContext,
  );

  const label = allowMultipleFiles
    ? I18N.text('Add More Files')
    : I18N.text('Replace File');
  const iconType = allowMultipleFiles ? 'svg-upload' : 'svg-refresh';

  const onDownloadClick = () => {
    invariant(
      fileInfo !== undefined,
      'Unsaved input files cannot be downloaded',
    );
    DataUploadService.downloadInputFile(
      sourceId,
      fileInfo.filePath,
      fileInfo.userFileName,
      sourceType === DATAPREP_TYPE,
    ).catch(() => Toaster.error(I18N.textById('Error downloading file')));
  };

  return (
    <Group.Vertical spacing="s">
      <Group.Horizontal
        alignItems="center"
        className="data-upload-upload-page__success-box"
        firstItemClassName="data-upload-upload-page__success-box-text"
        firstItemFlexValue={1}
        flex
      >
        {text}
        {fileInfo && (
          <Group.Item marginRight="none">
            <Button
              ariaName={I18N.textById('download file')}
              className="data-upload-upload-page__success-box-button"
              contentsClassName="data-upload-upload-page__icon-label-wrapper"
              minimal
              onClick={onDownloadClick}
              size="small"
            >
              <Icon type="svg-download-outline" />
            </Button>
          </Group.Item>
        )}
        <Button
          className="data-upload-upload-page__success-box-button"
          minimal
          onClick={onFileDelete}
          size="medium"
        >
          <LabelWrapper
            boldLabel
            className="data-upload-upload-page__icon-label-wrapper"
            contentClassName="data-upload-upload-page__success-box-icon"
            inline
            label={label}
            labelAfter
          >
            <Icon type={iconType} />
          </LabelWrapper>
        </Button>
      </Group.Horizontal>
      <LabelWrapper
        className="data-upload-upload-page__icon-label-wrapper"
        inline
        label={I18N.text('File format passes validation')}
        labelAfter
        labelClassName="data-upload-upload-page__validated-label u-info-text"
      >
        <Icon
          className="data-upload-upload-page__validated-icon"
          type="svg-check-circle-outline"
        />
      </LabelWrapper>
    </Group.Vertical>
  );
}
