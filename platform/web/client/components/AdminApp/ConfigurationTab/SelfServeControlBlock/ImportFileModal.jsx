// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import BaseModal from 'components/ui/BaseModal';
import Checkbox from 'components/ui/Checkbox';
import FileUploadValidation from 'components/common/FileUploadValidation';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import Spacing from 'components/ui/Spacing';
import UploadInput from 'components/ui/UploadInput';
import { VALIDATION_ERROR, VALIDATION_WARNING } from 'models/AdminApp/types';
import type { FileValidationResponse } from 'models/AdminApp/types';

type Props = {
  acceptedFileType: string,
  description?: React.Node,
  enableValidation?: boolean,
  isValidating?: boolean,
  isValidFile?: boolean,
  onClose: () => void,
  onDownloadConflictsSummary?: () => void,
  onFileSelected: (e: SyntheticEvent<HTMLInputElement>) => void,
  onImport: () => void,
  onShouldBackupDataChanged: boolean => void,
  onShowFileInput?: () => void,
  selectedFile?: File | null,
  shouldBackupData: boolean,
  show: boolean,
  title: string,
  validationResponse?: FileValidationResponse,
};

export default function ImportFileModal({
  acceptedFileType,
  description,
  enableValidation,
  isValidFile,
  isValidating,
  onClose,
  onDownloadConflictsSummary,
  onFileSelected,
  onImport,
  onShouldBackupDataChanged,
  onShowFileInput,
  selectedFile,
  shouldBackupData,
  show,
  title,
  validationResponse,
}: Props): React.Element<typeof BaseModal> {
  let modalDescription = I18N.text('Select file to import');
  if (description) modalDescription = description;

  const LOADING_SPINNER = (
    <Spacing flex justifyContent="center" marginTop="xxxl">
      <LoadingSpinner />
    </Spacing>
  );

  const hideBackupButton =
    validationResponse && validationResponse.resultType === VALIDATION_ERROR;

  const showModalDescription =
    selectedFile === null || selectedFile === undefined;

  const renderValidationResponse = (): React.Node => {
    const doValidation =
      enableValidation && selectedFile !== null && selectedFile !== undefined;
    if (!doValidation) return null;

    if (isValidating || validationResponse === undefined) {
      return LOADING_SPINNER;
    }

    const {
      resultType,
      validationMessage,
      validationSummary,
    } = validationResponse;

    const validationSummaryMap = Zen.Map.create(validationSummary);
    const validationMsgKeys = Object.keys(validationSummary);
    const summaryList = validationMsgKeys.map(msgKey => (
      <li key={msgKey}>
        <b>{msgKey}</b>: {validationSummaryMap.get(msgKey)}
      </li>
    ));
    const dataCatalogChangesSummary = <ul>{summaryList}</ul>;
    const fileName = selectedFile ? selectedFile.name : '';
    let validationTitle = (
      <I18N fileName={fileName}>%(fileName)s Passes Validation</I18N>
    );
    if (resultType === VALIDATION_WARNING) {
      validationTitle = (
        <I18N fileName={fileName}>
          %(fileName)s contains potential conflicts
        </I18N>
      );
    } else if (resultType === VALIDATION_ERROR) {
      validationTitle = I18N.text('Looks like the upload failed');
    }

    return (
      <FileUploadValidation
        dataCatalogChangesSummary={dataCatalogChangesSummary}
        onDownloadConflictsSummary={onDownloadConflictsSummary}
        resultType={resultType}
        showFileInput={onShowFileInput}
        title={validationTitle}
        validationMessage={validationMessage}
      />
    );
  };

  return (
    <BaseModal
      disablePrimaryButton={
        enableValidation &&
        (selectedFile === undefined || isValidating || !isValidFile)
      }
      onPrimaryAction={onImport}
      onRequestClose={onClose}
      primaryButtonText={I18N.text('Complete Upload')}
      show={show}
      title={title}
    >
      <Group.Vertical spacing="xl">
        <Group.Vertical>
          {showModalDescription && modalDescription}
          {!enableValidation || (enableValidation && !selectedFile) ? (
            <UploadInput
              accept={acceptedFileType}
              label={I18N.textById('Drag and drop or click to select file')}
              onChange={onFileSelected}
            />
          ) : (
            renderValidationResponse()
          )}
        </Group.Vertical>

        {!hideBackupButton && (
          <Checkbox
            label={I18N.text(
              'Download current self serve setup for backup purposes',
            )}
            onChange={onShouldBackupDataChanged}
            value={shouldBackupData}
          />
        )}
      </Group.Vertical>
    </BaseModal>
  );
}
