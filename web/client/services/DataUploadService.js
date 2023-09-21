// @flow
import Promise from 'bluebird';

import APIService, {
  API_VERSION,
  API_VERSION_TO_PREFIX,
} from 'services/APIService';
import Moment from 'models/core/wip/DateTime/Moment';
import autobind from 'decorators/autobind';
import uploadFileToServer from 'util/network/uploadFileToServer';
import { downloadFile } from 'util/util';
import type {
  DataFileUploadResponse,
  DataprepValidationResponse,
  ExistingDataFileResponse,
  FilePreview,
  SourceDateRanges,
} from 'models/DataUploadApp/types';
import type { HTTPService } from 'services/APIService';

class DataUploadService {
  _httpService: HTTPService;
  constructor(httpService: HTTPService) {
    this._httpService = httpService;
  }

  @autobind
  updateCSVSource(sourceId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.V2, 'data_upload_file_summary/update_csv_source', {
          sourceId,
        })
        .then(() => resolve())
        .catch(error => reject(error));
    });
  }

  @autobind
  deleteSource(sourceId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.V2, 'data_upload_file_summary/delete_source', {
          sourceId,
        })
        .then(resolve)
        .catch(reject);
    });
  }

  uploadDataFile(
    sourceId: string,
    file: Object,
  ): Promise<DataFileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const endpoint = `${API_VERSION_TO_PREFIX.V2}/data_upload_file_summary/upload_file/${sourceId}`;

    return uploadFileToServer(endpoint, formData);
  }

  /**
   * Validates a dataprep file by checking that the file's headers match the expected ones.
   * If the file passes validation, the server uploads the file to cloud storage.
   */
  validateDataprepUpload(
    sourceId: string,
    file: Object,
  ): Promise<DataprepValidationResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const endpoint = `${API_VERSION_TO_PREFIX.V2}/data_upload_file_summary/validate_dataprep_input/${sourceId}`;

    return uploadFileToServer(endpoint, formData);
  }

  /**
   * Validates the setup for a new dataprep source.
   * If the source passes validation, return:
   * - whether or not the source is parameterized
   * - expected columns for input files
   * - a list of uploaded files
   */
  validateDataprepSetup(
    sourceId: string,
    recipeId: number,
  ): Promise<{
    dataprepExpectedColumns: $ReadOnlyArray<string>,
    isFlowParameterized: boolean,
    uploadedFiles: $ReadOnlyArray<ExistingDataFileResponse>,
  }> {
    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.V2, 'data_upload_file_summary/setup_new_dataprep', {
          recipeId,
          sourceId,
        })
        .then(
          ({ dataprepExpectedColumns, isFlowParameterized, uploadedFiles }) =>
            resolve({
              dataprepExpectedColumns,
              isFlowParameterized,
              uploadedFiles: uploadedFiles.map(file => ({
                lastModified: Moment.utc(file.lastModified).local(),
                userFileName: file.userFileName,
              })),
            }),
        )
        .catch(error => reject(error));
    });
  }

  /**
   * Uploads/ deletes any files to GCS and starts the dataprep job for the source.
   */
  @autobind
  uploadAndStartDataprepJob(
    sourceId: string,
    filesToUpload: $ReadOnlyArray<{ filePath: string, userFileName: string }>,
    filesToDelete: $ReadOnlyArray<{ filePath: string, userFileName: string }>,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this._httpService
        .post(
          API_VERSION.V2,
          'data_upload_file_summary/upload_and_start_dataprep_job',
          { filesToDelete, filesToUpload, sourceId },
        )
        .then(resolve)
        .catch(reject);
    });
  }

  /**
   * Fetch info from dataprep and update all dataprep jobs records.
   * For all dataprep sources, gets all of the jobs that have not completed and fetches
   * their current status from dataprep. Returns the updated status and last date changed
   * as the backend may have changed it.
   */
  @autobind
  updateAllDataprepJobs(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._httpService
        .post(
          API_VERSION.V2,
          'data_upload_file_summary/update_all_dataprep_jobs',
        )
        .then(resolve)
        .catch(reject);
    });
  }

  /**
   * Gets a sample of rows from the uploaded CSV file. For now does not
   * aggregate the rows in any way. This service call is used to get the preview
   * for an existing source, since a newly uploaded source does not have its file
   * associated with the SelfServeSource object until the final submit on the preview
   * page.
   */
  @autobind
  getDataFilePreview(sourceId: string): Promise<FilePreview> {
    // If the sourceId is not defined yet, then there is no data to display in
    // the preview, so we just return an empty array.
    if (!sourceId) {
      return Promise.resolve([]);
    }
    return new Promise((resolve, reject) => {
      this._httpService
        .get(
          API_VERSION.V2,
          `data_upload_file_summary/get_preview?source_id=${encodeURIComponent(
            JSON.stringify(sourceId),
          )}`,
        )
        .then(preview => resolve(preview))
        .catch(error => reject(error));
    });
  }

  /**
   * Get the date range for all self serve sources.
   */
  @autobind
  getSourceDateRanges(): Promise<SourceDateRanges> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, `data_upload_file_summary/get_sources_date_ranges`)
        .then(preview => resolve(preview))
        .catch(error => reject(error));
    });
  }

  /**
   * Deletes any dataprep files stored in cloud storage when the changes were cancelled.
   * This occurs when the user has uploaded a file and then closed the modal and cancelled
   * the changes.
   */
  @autobind
  cleanFiles(
    sourceId: string,
    isDataprep: boolean,
    filesToCleanUp: $ReadOnlyArray<string>,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.V2, 'data_upload_file_summary/clean_files', {
          filesToCleanUp,
          isDataprep,
          sourceId,
        })
        .then(resolve)
        .catch(reject);
    });
  }

  /**
   * Download the input file at the provided file path.
   * @param {string} sourceId The source's source id; needed to build the correct file path.
   * @param {string} filePath The file name as it's stored in cloud storage.
   * @param {string} userFileName The file name the user uploaded and the name that's displayed
   *    in the front end. Used to set the name of the downloaded file.
   * @param {boolean} isDataprep Whether the source is a dataprep source to determine where the
   *    file is stored. Necessary since files can be downloaded for sources that aren't yet saved
   *    to the database.
   */
  @autobind
  downloadInputFile(
    sourceId: string,
    filePath: string,
    userFileName: string,
    isDataprep: boolean,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const requestParams = new URLSearchParams({
        is_dataprep: isDataprep.toString(),
        source_id: encodeURIComponent(sourceId),
      });
      const endpointUrl = `${
        API_VERSION_TO_PREFIX.V2
      }/data_upload_file_summary/download/${encodeURIComponent(
        filePath,
      )}?${requestParams.toString()}`;

      fetch(endpointUrl)
        .then(response => {
          if (!response.ok) throw Error(response.statusText);
          return response.blob();
        })
        .then(blob => {
          // All CSV input files are gzipped. If the uploaded file wasn't originally gzipped,
          // then update the extension.
          const fileName =
            isDataprep || userFileName.endsWith('.gz')
              ? userFileName
              : `${userFileName}.gz`;
          return resolve(downloadFile({ fileName, dataBlob: blob }));
        })
        .catch(error => {
          console.error(error);
          return reject(error);
        });
    });
  }
}

export default (new DataUploadService(APIService): DataUploadService);
