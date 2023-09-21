// @flow
import Promise from 'bluebird';
import invariant from 'invariant';

import APIService, { API_VERSION } from 'services/APIService';
import CachedMapService from 'services/wip/CachedMapService';
import CategoryService from 'services/wip/CategoryService';
// no way to avoid this circular dependency unfortunately
// eslint-disable-next-line import/no-cycle
import Dimension from 'models/core/wip/Dimension';
import autobind from 'decorators/autobind';
import { convertIDToURI, convertURIToID } from 'services/wip/util';
import type { APIVersion, HTTPService } from 'services/APIService';
import type { Cache, RejectFn, ResolveFn } from 'services/wip/CachedMapService';
import type { URI, URIConverter } from 'services/types/api';

class DimensionService extends CachedMapService<Dimension>
  implements URIConverter {
  apiVersion: APIVersion = API_VERSION.V2;
  endpoint: string;
  _httpService: HTTPService;

  constructor(httpService: HTTPService, checkAuthorization: boolean) {
    super();
    this.endpoint = checkAuthorization
      ? 'query/dimensions/authorized'
      : 'query/dimensions';
    this._httpService = httpService;
  }

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
          const category = CategoryService.UNSAFE_get(
            CategoryService.convertURIToID(rawDimension.category.$ref),
          );
          const dimension = Dimension.fromObject({
            category,
            description,
            id,
            name,
          });
          // NOTE: Since dimensions are not going to appear in only one
          // category,it makes sense to use both dimension_id and category_id
          // as the key in the dimensionMappingCache.
          dimensionMappingCache[
            `${dimension.id()}_${category ? category.id() : ''}`
          ] = dimension;
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

  // NOTE (Kenneth): This service was built with the assumption that each dimension will only
  // belong to one category. That assumption is no longer valid. Because of that, the cache key
  // is a combination of dimensionId and categoryId in the format `<dimensionId>_<categoryId>`
  findByFirstDimension(
    cache: Cache<Dimension>,
    dimensionId: string,
  ): Dimension | void {
    const firstKey = Object.keys(cache).find(key =>
      key.startsWith(dimensionId),
    );
    return firstKey ? cache[firstKey] : undefined;
  }

  /**
   * Retrieve a single value from the cache.
   *
   * key: string
   *
   * @returns Promise<T | void>
   */
  @autobind
  get(dimension: string): Promise<Dimension | void> {
    if (this._mappingCache) {
      return Promise.resolve(
        this.findByFirstDimension(this._mappingCache, dimension),
      );
    }

    return this.fetchMapping().then(() => {
      invariant(
        this._mappingCache !== undefined,
        'Mapping cache cannot be undefined if the promise was successful.',
      );
      return this.findByFirstDimension(this._mappingCache, dimension);
    });
  }
}

// NOTE: There are areas in which we want to constrain the dimensions
// that a user can see ie groupby and filter dropdowns, but we cannot completely
// remove an unauthorized dimension from a user's client which is why we have
// two services here.
export const AuthorizedDimensionService = (new DimensionService(
  APIService,
  true,
): DimensionService);

export default (new DimensionService(APIService, false): DimensionService);
