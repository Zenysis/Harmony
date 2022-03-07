// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import ImportConfirmationModal from 'components/AdminApp/ConfigurationTab/DataCatalogControlBlock/ImportConfirmationModal';
import ImportFileModal from 'components/AdminApp/ConfigurationTab/DataCatalogControlBlock/ImportFileModal';
import Toaster from 'components/ui/Toaster';
import uploadFileToServer from 'util/network/uploadFileToServer';
import useBoolean from 'lib/hooks/useBoolean';

type Props = {
  onExportDataCatalogButtonClick: () => void,
  onImportModalClose: () => void,
  onImportModalOpen: () => void,
  showImportModal: boolean,
};

const IMPORT_DATA_CATALOG_ENDPOINT = '/api/import_data_catalog';

export default function ImportDataCatalogWrapper({
  onExportDataCatalogButtonClick,
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

  const onConfirmImportDataCatalog = () => {
    if (uploadedFile) {
      if (shouldBackupData) {
        // TODO(solo): A race condition related to downloading backup and
        // importing could occur here. A download could be triggered and
        // take a long time to run. when it takes a long time to run,
        // then it is possible the file being uploaded is sent all the way
        // to the server and the tables from the uploaded file start getting
        // replaced before the download has finished. We need to ensure this
        // doesn't happen.
        onExportDataCatalogButtonClick();
      }
      setIsImporting(true);
      const data = new FormData();
      data.append('file', uploadedFile);
      Toaster.success(
        I18N.text('Your data catalog import might take sometime to complete'),
      );
      uploadFileToServer<{ success: boolean }>(
        IMPORT_DATA_CATALOG_ENDPOINT,
        data,
      )
        .then(({ success }) => {
          if (success) {
            Toaster.success(
              I18N.text('Your data catalog import completed successfully'),
            );
            analytics.track('Import data catalog in Site Config', {
              status: 'successful',
            });
          } else {
            Toaster.error(I18N.textById('importFailed'));
            analytics.track('Import data catalog in Site Config', {
              status: 'failed',
            });
          }
        })
        .catch(() => {
          Toaster.error(
            I18N.text('Your data catalog import failed', 'importFailed'),
          );
          analytics.track('Import data catalog in Site Config', {
            status: 'failed',
          });
        })
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
      setUploadedFile(file);
    }
  };

  const onCloseConfirmationModal = React.useCallback(() => {
    closeImportConfirmationModal();
    onImportModalOpen();
  }, [closeImportConfirmationModal, onImportModalOpen]);

  const confirmationModalTitle = uploadedFile ? (
    <I18N fileName={uploadedFile.name}>
      Are you sure you want to import %(fileName)s?
    </I18N>
  ) : null;
  const confirmationModalDescription = (
    <I18N id="importCatalogPrompt">
      Importing this new data catalog will overwrite the currently active
      catalog. In doing so, note that you may overwrite changes not included in
      the imported data catalog. After completing this action, If an issue
      arises with the new data catalog, you can re-import the current data
      catalog (found in your Downloads folder).
    </I18N>
  );

  return (
    <React.Fragment>
      <ImportFileModal
        acceptedFileType="application/zip"
        onClose={onImportModalClose}
        onFileSelected={onFileSelected}
        onImport={onImport}
        shouldBackupData={shouldBackupData}
        onShouldBackupDataChanged={onShouldBackupDataChanged}
        show={showImportModal}
        title={I18N.textById('importDataCatalog')}
      />
      {uploadedFile && (
        <ImportConfirmationModal
          description={confirmationModalDescription}
          isImporting={isImporting}
          onCancel={onCloseConfirmationModal}
          onImportStart={onConfirmImportDataCatalog}
          show={showImportConfirmationModal}
          title={confirmationModalTitle}
        />
      )}
    </React.Fragment>
  );
}
