// @flow
import Promise from 'bluebird';

import APIService, { API_VERSION } from 'services/APIService';
import DimensionValue from 'models/core/wip/Dimension/DimensionValue';
import SelectorFilter from 'models/core/wip/QueryFilter/SelectorFilter';
import autobind from 'decorators/autobind';
import type { HTTPService } from 'services/APIService';

// Utility function to create DimensionValues for which the filter doesn't matter
export function generateEntityDimensionValue(
  id: string,
  dimension: string,
  name: string,
): DimensionValue {
  return DimensionValue.create({
    dimension,
    id,
    name,
    filter: SelectorFilter.create({
      dimension,
      value: id,
    }),
  });
}

// TODO: convert to cached service if performance needs to improve.
class EntityDimensionValueService {
  _httpService: HTTPService;
  constructor(httpService: HTTPService) {
    this._httpService = httpService;
  }

  /**
   * Search for matching DimensionValue with a given search term in the
   * given metadata entry. If the search term is an empty string, this will
   * automatically return an empty array.
   *
   * @param {int} entityTypeId The id of the entity type to fetch.
   * @param {string} metadataName The metadata to query.
   * @param {string} searchTerm The search term to filter case insensitive on.
   *
   * @returns {Promise<Array<DimensionValue>>} The list of matching values.
   */
  @autobind
  searchMetadataValues(
    entityTypeId: number,
    searchTerm: string,
    metadataName: string,
  ): Promise<Array<DimensionValue>> {
    // empty string is not a valid search term for an entity dimension value
    if (searchTerm === '') {
      return Promise.resolve([]);
    }

    return new Promise((resolve, reject) => {
      this._httpService
        .get(
          API_VERSION.V2,
          `raw_pipeline_entity/search_metadata?entity_type_id=${entityTypeId}&metadata_name=${metadataName}&term=${searchTerm}`,
        )
        .then(values => {
          resolve(
            values.map(value =>
              generateEntityDimensionValue(value, metadataName, value),
            ),
          );
        })
        .catch(reject);
    });
  }
}

export default (new EntityDimensionValueService(
  APIService,
): EntityDimensionValueService);
