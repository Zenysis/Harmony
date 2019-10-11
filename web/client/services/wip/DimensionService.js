// @flow
import Promise from 'bluebird';

import APIService, { API_VERSION } from 'services/APIService';
import CachedMapService from 'services/wip/CachedMapService';
import CategoryService from 'services/wip/CategoryService';
import Dimension from 'models/core/wip/Dimension';
import { convertIDToURI, convertURIToID } from 'services/wip/util';
import type { APIVersion, HTTPService } from 'services/APIService';
import type { Cache, RejectFn, ResolveFn } from 'services/wip/CachedMapService';
import type { URI, URIConverter } from 'services/types/api';

const TEXT = t('select_granularity');

class DimensionService extends CachedMapService<Dimension>
  implements URIConverter {
  apiVersion: APIVersion = API_VERSION.V2;
  endpoint: string = 'wip/dimensions';
  _httpService: HTTPService;

  constructor(httpService: HTTPService) {
    super();
    this._httpService = httpService;
  }

  // eslint-disable-next-line class-methods-use-this
  buildCache(
    resolve: ResolveFn<Dimension>,
    reject: RejectFn,
  ): Promise<Cache<Dimension>> {
    return Promise.all([
      this._httpService.get(this.apiVersion, this.endpoint),
      CategoryService.getAll(),
    ])
      .then(([rawDimensionList]) => {
        const dimensionMappingCache = {};
        rawDimensionList.forEach(rawDimension => {
          const { description, id, name } = rawDimension;
          const translatedName = name.length ? name : TEXT[id] || id;
          const category = CategoryService.UNSAFE_get(
            CategoryService.convertURIToID(rawDimension.category.$ref),
          );
          const dimension = Dimension.create({
            category,
            description,
            id,
            name: translatedName,
          });
          dimensionMappingCache[dimension.id()] = dimension;
        });
        resolve(dimensionMappingCache);
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

export default new DimensionService(APIService);
