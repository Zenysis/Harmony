// @flow
import Promise from 'bluebird';

import APIService, { API_VERSION } from 'services/APIService';
import Dimension from 'models/core/wip/Dimension';
import DimensionValue from 'models/core/wip/Dimension/DimensionValue';
import autobind from 'decorators/autobind';
import type { APIVersion, HTTPService } from 'services/APIService';

class DimensionValueSearchService {
  apiVersion: APIVersion = API_VERSION.V2;
  endpoint: string = 'wip/dimension_values/search';
  _cache: { [dimensionId: string]: DimensionValue };
  _httpService: HTTPService;

  constructor(httpService: HTTPService) {
    this._httpService = httpService;
    this._cache = {};
  }

  @autobind
  get(
    searchTerm: string,
    dimension: Dimension,
  ): Promise<Array<DimensionValue>> {
    const queryString = `?where={"name":{"$icontains":"${searchTerm}"}}`;

    const uri = `${this.endpoint}/${dimension.id()}${queryString}`;
    return this._httpService
      .get(this.apiVersion, uri)
      .then(rawDimensionValuesList =>
        rawDimensionValuesList.map(rawDimensionValue =>
          DimensionValue.UNSAFE_deserialize(rawDimensionValue),
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

export default new DimensionValueSearchService(APIService);
