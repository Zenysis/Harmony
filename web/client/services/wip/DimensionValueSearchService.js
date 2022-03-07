// @flow
import Promise from 'bluebird';

import APIService, { API_VERSION } from 'services/APIService';
import DimensionValue from 'models/core/wip/Dimension/DimensionValue';
import autobind from 'decorators/autobind';
import type { APIVersion, HTTPService } from 'services/APIService';

// TODO(david): Add a cache so we do not have to make repeat requests for the
// same search term. (The current cache does not do this - it only ensures
// that we do not have multiple DimensionValue instances representing the same
// dimension value).
class DimensionValueSearchService {
  apiVersion: APIVersion = API_VERSION.V2;
  endpoint: string = 'query/dimension_values/search';
  _cache: { [dimensionId: string]: DimensionValue, ... };
  _httpService: HTTPService;

  constructor(httpService: HTTPService) {
    this._httpService = httpService;
    this._cache = {};
  }

  /**
   * Search for matching DimensionValues with a given search term in a
   * Dimension. If the search term is an empty string, this will
   * automatically return an empty array.
   */
  @autobind
  get(searchTerm: string, dimensionId: string): Promise<Array<DimensionValue>> {
    // empty string is not a valid search term for a dimension value
    if (searchTerm === '') {
      return Promise.resolve([]);
    }

    const queryString = `?where={"name":{"$icontains":"${searchTerm}"}}`;

    const uri = `${this.endpoint}/${dimensionId}${queryString}`;
    return this._httpService
      .get(this.apiVersion, uri)
      .then(rawDimensionValuesList =>
        Promise.all(
          rawDimensionValuesList.map(DimensionValue.deserializeAsync),
        ),
      )
      .then(dimensionValues =>
        // Note(david): This cache ensures that we do not construct
        // a new object representing the same dimension value as one that has
        // previously been searched. This is needed as the filter selection
        // block relies on referential equality between identical dimension
        // values.
        dimensionValues.map(dimensionValue => {
          if (!this._cache[dimensionValue.id()]) {
            this._cache[dimensionValue.id()] = dimensionValue;
          }
          return this._cache[dimensionValue.id()];
        }),
      );
  }
}

export default (new DimensionValueSearchService(
  APIService,
): DimensionValueSearchService);
