// @flow
import Promise from 'bluebird';

import APIService, { API_VERSION } from 'services/APIService';
import CachedMapService from 'services/wip/CachedMapService';
import CategoryService from 'services/wip/CategoryService';
import Granularity from 'models/core/wip/Granularity';
import autobind from 'decorators/autobind';
import { convertIDToURI, convertURIToID } from 'services/wip/util';
import type { APIVersion, HTTPService } from 'services/APIService';
import type { Cache, RejectFn, ResolveFn } from 'services/wip/CachedMapService';
import type { URI, URIConverter } from 'services/types/api';

/**
 * The GranularityService is used to fetch the different supported Granularites
 * that exist from the server.
 */
class GranularityService extends CachedMapService<Granularity>
  implements URIConverter {
  apiVersion: APIVersion = API_VERSION.V2;
  endpoint: string = 'wip/granularities';
  _httpService: HTTPService;

  constructor(httpService: HTTPService) {
    super();
    this._httpService = httpService;
  }

  buildCache(
    resolve: ResolveFn<Granularity>,
    reject: RejectFn,
  ): Promise<Cache<Granularity>> {
    return Promise.all([
      this._httpService.get(this.apiVersion, this.endpoint),
      CategoryService.getAll(),
    ])
      .then(([rawGranularityList]) => {
        const granularityMappingCache = {};
        rawGranularityList.forEach(rawGranularity => {
          const { id, name, description } = rawGranularity;
          const category = CategoryService.UNSAFE_get(
            CategoryService.convertURIToID(rawGranularity.category.$ref),
          );
          const granularity = Granularity.create({
            category,
            description,
            id,
            name,
          });
          granularityMappingCache[granularity.id()] = granularity;
        });
        resolve(granularityMappingCache);
      })
      .catch(reject);
  }

  convertURIToID(uri: URI): string {
    return convertURIToID(uri, this.apiVersion, this.endpoint);
  }

  convertIDToURI(id: string): URI {
    return convertIDToURI(id, this.apiVersion, this.endpoint);
  }

  /**
   * Fetches all the granularites enabled for AQT for the current deployment.
   * Some granularites are enabled in the backend for AQT style queries used
   * elsewhere (e.g. Data Quality Lab) but we do not want them to be used in AQT
   * itself.
   */
  @autobind
  getAllAQT() {
    // HACK(stephen, vinh): Figure out how to have the backend support all
    // granularity types so that DQL can still query by "day" even if we don't
    // want to show it for AQT. This current hack was added so that DQL could
    // query daily data without having "Day" show up in the AQT query form. The
    // other hack was added so that "Month of Year" would still work without
    // having to specify it in every config.
    const AQT_ENABLED_GRANULARITIES =
      window.__JSON_FROM_BACKEND.aqtEnabledGranularites;
    return super
      .getAll()
      .then(granularities =>
        granularities.filter(granularity =>
          AQT_ENABLED_GRANULARITIES.includes(
            granularity.id().replace('_of_year', ''),
          ),
        ),
      );
  }
}

export default new GranularityService(APIService);
