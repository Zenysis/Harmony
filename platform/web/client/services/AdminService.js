// @flow
import Promise from 'bluebird';

import APIService, { API_VERSION_TO_PREFIX } from 'services/APIService';
import uploadFileToServer from 'util/network/uploadFileToServer';
import type { FileValidationResponse } from 'models/AdminApp/types';
import type { HTTPService } from 'services/APIService';

class AdminService {
  _httpService: HTTPService;
  constructor(httpService: HTTPService) {
    this._httpService = httpService;
  }

  /**
   * Performs validation on a selected self serve (or data catalog) .zip file
   */
  validateSelfServeUpload(file: Object): Promise<FileValidationResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const endpoint = `${API_VERSION_TO_PREFIX.V1}/validate_self_serve_upload`;

    return uploadFileToServer(endpoint, formData);
  }
}

export default (new AdminService(APIService): AdminService);
