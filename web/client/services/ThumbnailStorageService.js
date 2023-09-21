// @flow
import Promise from 'bluebird';

import APIService, { API_VERSION } from 'services/APIService';
import autobind from 'decorators/autobind';
import type { HTTPService } from 'services/APIService';

type Base64ImageString = string;

class ThumbnailStorageService {
  _httpService: HTTPService;
  constructor(httpService: HTTPService) {
    this._httpService = httpService;
  }

  /**
   * Retrieves a value from redis with its associated key.
   *
   * @param {string} A key to which its value will be returned.
   */
  @autobind
  retrieveFromStorage(key: string): Promise<Base64ImageString> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, `storage/retrieve?key=${key}`)
        .then(value => resolve(value))
        .catch(error => reject(error));
    });
  }
}

export default (new ThumbnailStorageService(
  APIService,
): ThumbnailStorageService);
