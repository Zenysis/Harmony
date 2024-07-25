// @flow
import type Promise from 'bluebird';

import APIService, { API_VERSION } from 'services/APIService';
import CachedMapService from 'services/wip/CachedMapService';
import Dataset from 'models/core/wip/Dataset';
import { convertIDToURI, convertURIToID } from 'services/wip/util';
import type { APIVersion, HTTPService } from 'services/APIService';
import type { Cache, RejectFn, ResolveFn } from 'services/wip/CachedMapService';
import type { URI, URIConverter } from 'services/types/api';

/**
 * The DatasetService is used to fetch the different Datasets that exist
 * from the server.
 */
class DatasetService extends CachedMapService<Dataset> implements URIConverter {
  apiVersion: APIVersion = API_VERSION.V2;
  endpoint: string = 'query/datasets';
  _httpService: HTTPService;
  constructor(httpService: HTTPService) {
    super();
    this._httpService = httpService;
  }

  buildCache(
    resolve: ResolveFn<Dataset>,
    reject: RejectFn,
  ): Promise<Cache<Dataset>> {
    // Fetch the list of datasets.
    return this._httpService
      .get(this.apiVersion, this.endpoint)
      .then(rawDatasetList => {
        const datasetMappingCache = {};
        // Deserialize the raw datasets and cache their values.
        rawDatasetList.forEach(({ $uri, ...rawDataset }) => {
          const dataset = Dataset.create(rawDataset);
          const datasetId: string = dataset.id();
          datasetMappingCache[datasetId] = dataset;
        });
        resolve(datasetMappingCache);
      })
      .catch(reject);
  }

  convertURIToID(uri: URI): string {
    return convertURIToID(uri, this.apiVersion, this.endpoint);
  }

  convertIDToURI(id: string): URI {
    return convertIDToURI(id, this.apiVersion, this.endpoint);
  }
}

export default (new DatasetService(APIService): DatasetService);
