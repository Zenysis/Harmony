// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import AdminService from 'services/AdminService';
import I18N from 'lib/I18N';
import ImportConfirmationModal from 'components/AdminApp/ConfigurationTab/SelfServeControlBlock/ImportConfirmationModal';
import ImportFileModal from 'components/AdminApp/ConfigurationTab/SelfServeControlBlock/ImportFileModal';
import Toaster from 'components/ui/Toaster';
import uploadFileToServer from 'util/network/uploadFileToServer';
import useBoolean from 'lib/hooks/useBoolean';
import usePromiseCleanUp from 'lib/hooks/usePromiseCleanUp';
import {
  VALIDATION_ERROR,
  VALIDATION_SUCCESS,
  VALIDATION_WARNING,
} from 'models/AdminApp/types';
import { cancelPromise } from 'util/promiseUtil';
import { downloadFile } from 'util/util';
import type { FileValidationResponse } from 'models/AdminApp/types';

type Props = {
  onExportSelfServeButtonClick: () => void,
  onImportModalClose: () => void,
  onImportModalOpen: () => void,
  showImportModal: boolean,
};

const IMPORT_SELF_SERVE_ENDPOINT = '/api/import_self_serve';
const DOWNLOAD_SUMMARY_FILE_ENDPOINT = '/api/download_data_catalog_changes';

export default function ImportSelfServeWrapper({
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

  const [isValidating, setIsValidating] = React.useState<boolean>(false);
  const [isValidFile, setIsValidFile] = React.useState<boolean>(false);
  const [
    response,
    setResponse,
  ] = React.useState<FileValidationResponse | void>();
  const setValidationPromise = usePromiseCleanUp();

  React.useEffect(() => {
    if (uploadedFile === undefined) return undefined;

    setIsValidating(true);
    const promise = AdminService.validateSelfServeUpload(uploadedFile)
      .then((resp: FileValidationResponse) => {
        setIsValidFile(true);
        setResponse({
          resultType: VALIDATION_SUCCESS,
          ...resp,
        });
      })
      .catch(error => {
        if (error.data.statusCode === 409) {
          setIsValidFile(true);
          setResponse({
            resultType: VALIDATION_WARNING,
            ...error.data,
          });
        } else {
          setIsValidFile(false);
          setResponse({
            resultType: VALIDATION_ERROR,
            validationMessage: error.data.msg,
            validationSummary: Zen.Map.create(),
          });
        }
      })
      .finally(() => {
        setIsValidating(false);
      });

    return () => {
      cancelPromise(promise);
    };
  }, [uploadedFile, setValidationPromise, setIsValidating, setIsValidFile]);

  const onDownloadConflictsSummary = () => {
    const dataCatalogChangesFileKey =
      response && response.dataCatalogChangesFileKey;
    if (!dataCatalogChangesFileKey) {
      return;
    }
    downloadFile({
      endpoint: `${DOWNLOAD_SUMMARY_FILE_ENDPOINT}?changes_summary_file_key=${dataCatalogChangesFileKey}`,
    });
    Toaster.success(
      I18N.text(
        'Your data catalog conflicts summary file will download shortly',
      ),
    );
  };

  const onRequestModalClose = () => {
    setUploadedFile(undefined);
    onImportModalClose();
  };

  const onShowFileInput = () => {
    setUploadedFile(undefined);
  };

  const onConfirmImportSelfServe = () => {
    if (uploadedFile) {
      if (shouldBackupData) {
        // TODO: A rare condition related to downloading backup and
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
        I18N.text(
          'Your self serve setup import might take some time to complete',
        ),
      );
      uploadFileToServer<{ success: boolean }>(IMPORT_SELF_SERVE_ENDPOINT, data)
        .then(({ success }) => {
          if (success) {
            Toaster.success(
              I18N.text('Your self serve setup import completed successfully'),
            );
          } else {
            Toaster.error(I18N.textById('importFailed'));
          }
        })
        .catch(() => {
          Toaster.error(
            I18N.text('Your self serve setup import failed', 'importFailed'),
          );
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
    <I18N id="importSetupPrompt">
      Importing this new self serve setup will overwrite the currently active
      data catalog and data upload sources. In doing so, note that you may
      overwrite changes not included in the imported setup. After completing
      this action, if an issue arises with the new self serve setup, you can
      re-import the current self serve setup (found in your Downloads folder).
    </I18N>
  );

  const selfServeDescription = (
    <I18N>
      Import a self serve setup to replace the active one on this instance. You
      can export this setup in the Admin App in the Site Configuration tab. This
      setup will replace the existing metadata in this instance for the
      following records: Field, Field Category, Dimension, Dimension Category,
      and Datasource.
    </I18N>
  );

  return (
    <React.Fragment>
      <ImportFileModal
        acceptedFileType=".zip"
        description={selfServeDescription}
        enableValidation
        isValidating={isValidating}
        isValidFile={isValidFile}
        onClose={onRequestModalClose}
        onDownloadConflictsSummary={onDownloadConflictsSummary}
        onFileSelected={onFileSelected}
        onImport={onImport}
        onShouldBackupDataChanged={onShouldBackupDataChanged}
        onShowFileInput={onShowFileInput}
        selectedFile={uploadedFile}
        shouldBackupData={shouldBackupData}
        show={showImportModal}
        title={I18N.textById('importSelfServe')}
        validationResponse={response}
      />
      {isValidFile && uploadedFile && (
        <ImportConfirmationModal
          description={confirmationModalDescription}
          isImporting={isImporting}
          onCancel={onCloseConfirmationModal}
          onImportStart={onConfirmImportSelfServe}
          show={showImportConfirmationModal}
          title={confirmationModalTitle}
        />
      )}
    </React.Fragment>
  );
}
