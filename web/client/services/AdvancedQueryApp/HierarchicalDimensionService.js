// @flow
import APIService from 'services/APIService';
import type { HTTPService } from 'services/APIService';
/**
 * HierarchicalDimensionService is used to extract
 * the list of hierarchical dimensions associated
 * with a particular deployment.
 */
class HierarchicalDimensionService {
  _httpService: HTTPService;
  constructor(httpService: HTTPService) {
    this._httpService = httpService;
  }

  getGeoFieldOrdering(): $ReadOnlyArray<string> {
    return (window.__JSON_FROM_BACKEND || {}).geoFieldOrdering || [];
  }
}

export default (new HierarchicalDimensionService(
  APIService,
): HierarchicalDimensionService);
