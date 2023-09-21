// @flow
import Promise from 'bluebird';

import APIService, { API_VERSION } from 'services/APIService';
import CachedMapService from 'services/wip/CachedMapService';
import CalendarSettings from 'models/config/CalendarSettings';
// no way to avoid this circular dependency unfortunately
// eslint-disable-next-line import/no-cycle
import Granularity from 'models/core/wip/Granularity';
import I18N from 'lib/I18N';
import LinkedCategory from 'models/core/wip/LinkedCategory';
import autobind from 'decorators/autobind';
import { convertIDToURI, convertURIToID } from 'services/wip/util';
import type { APIVersion, HTTPService } from 'services/APIService';
import type { Cache, RejectFn, ResolveFn } from 'services/wip/CachedMapService';
import type { URI, URIConverter } from 'services/types/api';

// NOTE: Right now, the date group and date extraction categories are
// the only categories used by the Granularity types. Instead of requiring them
// to be defined in the DB, we stub them out here. This helps ease the
// transition to data catalog powered services.
const DATE_GROUP_CATEGORY = LinkedCategory.create({
  id: 'date_groups',
  name: I18N.text('Date Group'),
});
const DATE_EXTRACTION_CATEGORY = LinkedCategory.create({
  id: 'date_extraction',
  name: I18N.text('Date Extraction'),
});

/**
 * The GranularityService is used to fetch the different supported Granularites
 * that exist from the server.
 */
class GranularityService extends CachedMapService<Granularity>
  implements URIConverter {
  apiVersion: APIVersion = API_VERSION.V2;
  endpoint: string = 'query/granularities';
  _httpService: HTTPService;

  constructor(httpService: HTTPService) {
    super();
    this._httpService = httpService;
  }

  buildCache(
    resolve: ResolveFn<Granularity>,
    reject: RejectFn,
  ): Promise<Cache<Granularity>> {
    return this._httpService
      .get(this.apiVersion, this.endpoint)
      .then(rawGranularityList => {
        const granularityMappingCache = {};
        rawGranularityList.forEach(rawGranularity => {
          const { description, id, name } = rawGranularity;
          const categoryId = rawGranularity.category.id;
          const category =
            categoryId === 'date_groups'
              ? DATE_GROUP_CATEGORY
              : DATE_EXTRACTION_CATEGORY;
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
  getAllAQT(): Promise<Array<Granularity>> {
    const enabledGranularityIds = CalendarSettings.current()
      .granularitySettings()
      .enabledGranularities()
      .map(g => g.id());
    return super
      .getAll()
      .then(granularities =>
        granularities.filter(granularity =>
          enabledGranularityIds.includes(granularity.id()),
        ),
      );
  }
}

export default (new GranularityService(APIService): GranularityService);
