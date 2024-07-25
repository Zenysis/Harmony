// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import ImportConfirmationModal from 'components/AdminApp/ConfigurationTab/SelfServeControlBlock/ImportConfirmationModal';
import ImportFileModal from 'components/AdminApp/ConfigurationTab/SelfServeControlBlock/ImportFileModal';
import Toaster from 'components/ui/Toaster';
import uploadFileToServer from 'util/network/uploadFileToServer';
import useBoolean from 'lib/hooks/useBoolean';

type Props = {
  onExportSelfServeButtonClick: () => void,
  onImportModalClose: () => void,
  onImportModalOpen: () => void,
  showImportModal: boolean,
};

const IMPORT_FIELDS_ENDPOINT = '/api/import_data_catalog_fields_csv';

export default function ImportFieldsFromCSVWrapper({
  onExportSelfServeButtonClick,
  onImportModalClose,
  onImportModalOpen,
  showImportModal,
}: Props): React.Element<typeof React.Fragment> {
  const [isImporting, setIsImporting] = React.useState<boolean>(false);
  const [shouldBackupData, onShouldBackupDataChanged] = React.useState<boolean>(
    true,
  );
  const [uploadedFile, setUploadedFile] = React.useState<File | void>();
  const [
    showImportConfirmationModal,
    openImportConfirmationModal,
    closeImportConfirmationModal,
  ] = useBoolean(false);

  const onImport = React.useCallback(() => {
    onImportModalClose();
    openImportConfirmationModal();
  }, [onImportModalClose, openImportConfirmationModal]);

  const onConfirmImportFieldsCSV = () => {
    if (uploadedFile) {
      if (shouldBackupData) {
        // TODO: A race condition related to downloading backup and
        // importing could occur here. A download could be triggered and
        // take a long time to run. when it takes a long time to run,
        // then it is possible the file being uploaded is sent all the way
        // to the server and the tables from the uploaded file start getting
        // replaced before the download has finished. We need to ensure this
        // doesn't happen.
        onExportSelfServeButtonClick();
      }
      setIsImporting(true);
      const data = new FormData();
      data.append('file', uploadedFile);
      Toaster.success(
        I18N.text('Your fields csv import might take some time to complete'),
      );
      uploadFileToServer<{
        errorLogs: $ReadOnlyArray<string>,
        outputStats: string,
      }>(IMPORT_FIELDS_ENDPOINT, data)
        .then(({ errorLogs, outputStats }) => {
          const msgLines = outputStats.split(' \n');
          const description = (
            <Group.Vertical spacing="none">{msgLines}</Group.Vertical>
          );
          if (errorLogs.length === 0) {
            Toaster.success(
              I18N.text(
                'Your fields csv import completed successfully.',
                'csvImportSuccess',
              ),
              { description },
            );
          } else {
            const errors = (
              <Group.Vertical spacing="none">{errorLogs}</Group.Vertical>
            );
            const errorDescription = (
              <Group.Vertical>
                {description}
                {errors}
              </Group.Vertical>
            );
            Toaster.error(
              I18N.text('Your fields csv import failed.', 'importCSVFailed'),
              { description: errorDescription },
            );
          }
        })
        .catch(() => Toaster.error(I18N.textById('importCSVFailed')))
        .finally(() => {
          setIsImporting(false);
          setUploadedFile(undefined);
          closeImportConfirmationModal();
        });
    }
  };

  const onFileSelected = (e: SyntheticEvent<HTMLInputElement>) => {
    if (e.target instanceof HTMLInputElement) {
      const file = e.target.files[0];
      if (file) {
        setUploadedFile(file);
      }
    }
  };

  const onCloseConfirmationModal = React.useCallback(() => {
    closeImportConfirmationModal();
    onImportModalOpen();
  }, [closeImportConfirmationModal, onImportModalOpen]);

  const confirmationModalTitle = uploadedFile ? (
    <I18N csvFileName={uploadedFile.name}>
      Are you sure you want to import %(csvFileName)s?
    </I18N>
  ) : null;
  const confirmationModalDescription = (
    <I18N id="importFieldsPrompt">
      Importing this file will add new fields into data catalog that you will be
      unable to remove. However, you are able to hide these indicators. After
      completing this action, if an issue arises with the new self serve setup,
      you can re-import the current self serve setup (found in your Downloads
      folder).
    </I18N>
  );

  return (
    <React.Fragment>
      <ImportFileModal
        acceptedFileType=".csv"
        onClose={onImportModalClose}
        onFileSelected={onFileSelected}
        onImport={onImport}
        onShouldBackupDataChanged={onShouldBackupDataChanged}
        shouldBackupData={shouldBackupData}
        show={showImportModal}
        title={I18N.textById('importNewIndicators')}
      />
      {uploadedFile && (
        <ImportConfirmationModal
          description={confirmationModalDescription}
          isImporting={isImporting}
          onCancel={onCloseConfirmationModal}
          onImportStart={onConfirmImportFieldsCSV}
          show={showImportConfirmationModal}
          title={confirmationModalTitle}
        />
      )}
    </React.Fragment>
  );
}
