// @flow
import Promise from 'bluebird';

import APIService, { API_VERSION } from 'services/APIService';
import CachedMapService from 'services/wip/CachedMapService';
import CategoryService from 'services/wip/CategoryService';
import DimensionService from 'services/wip/DimensionService';
import Field from 'models/core/wip/Field';
import { convertIDToURI, convertURIToID } from 'services/wip/util';
import type { APIVersion, HTTPService } from 'services/APIService';
import type { Cache, RejectFn, ResolveFn } from 'services/wip/CachedMapService';
import type { URI, URIConverter } from 'services/types/api';

/**
 * The FieldService is used to retrieve all the calculable Fields that exist.
 */
class FieldService extends CachedMapService<Field> implements URIConverter {
  apiVersion: APIVersion = API_VERSION.V2;
  endpoint: string = 'query/fields';
  _httpService: HTTPService;

  constructor(httpService: HTTPService) {
    super();
    this._httpService = httpService;
  }

  buildCache(
    resolve: ResolveFn<Field>,
    reject: RejectFn,
  ): Promise<Cache<Field>> {
    // Performance optimization: preload services needed during deserialization
    // of the field so that we can use the Field.UNSAFE_deserialize synchronous
    // deserialization method. If we use Field.deserializeAsync, thousands of
    // promises will be created, and the resolution of all those promises is
    // slow and noticeable. Using the UNSAFE_deserialize method is preferred
    // in this case.
    const promise = Promise.all([
      this._httpService.get(this.apiVersion, this.endpoint),
      CategoryService.getAll(),
      DimensionService.getAll(),
    ]);
    return promise
      .then(([rawFieldList]) => {
        const fieldMappingCache = {};
        rawFieldList.forEach(serializedField => {
          const field = Field.UNSAFE_deserialize(serializedField);
          fieldMappingCache[field.id()] = field;
        });
        resolve(fieldMappingCache);
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

export default (new FieldService(APIService): FieldService);
