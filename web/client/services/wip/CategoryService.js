// @flow
import type Promise from 'bluebird';

import APIService, { API_VERSION } from 'services/APIService';
import CachedMapService from 'services/wip/CachedMapService';
// No way to avoid this circular dependency unfortunately.
// eslint-disable-next-line import/no-cycle
import LinkedCategory from 'models/core/wip/LinkedCategory';
import { convertIDToURI, convertURIToID } from 'services/wip/util';
import type { APIVersion, HTTPService } from 'services/APIService';
import type { Cache, RejectFn, ResolveFn } from 'services/wip/CachedMapService';
import type { URI, URIConverter } from 'services/types/api';

// Deserialize a raw LinkedCategory object. The parent category is created by
// recursively building all a category's parents.
function _buildCategoryTreeHelper(
  rawCategoryMapping,
  categoryId,
  collectedCategories = {},
) {
  // If this category has no ID, we're done.
  if (!categoryId) {
    return undefined;
  }

  // If we have already created this category earlier, return it now.
  if (collectedCategories[categoryId]) {
    return collectedCategories[categoryId];
  }

  const curRawCategory = rawCategoryMapping[categoryId];
  const parentCategoryId =
    curRawCategory.parent !== null
      ? // eslint-disable-next-line no-use-before-define
        CategoryServiceImpl.convertURIToID(curRawCategory.parent.$ref)
      : undefined;

  if (parentCategoryId === categoryId) {
    return collectedCategories[categoryId];
  }
  // Create the linked parent category.
  const parentCategory = _buildCategoryTreeHelper(
    rawCategoryMapping,
    parentCategoryId,
    collectedCategories,
  );

  // Deserialize the raw category now that we have the full parent object.
  const category = LinkedCategory.create({
    ...curRawCategory,
    parent: parentCategory,
  });

  // Memoize our work as we go.
  // eslint-disable-next-line no-param-reassign
  collectedCategories[categoryId] = category;
  return category;
}

// Build a mapping from category ID to a full LinkedCategory model.
function buildCategoryTree(rawCategoryMapping) {
  const output = {};
  Object.keys(rawCategoryMapping).forEach(categoryId => {
    if (!output[categoryId]) {
      output[categoryId] = _buildCategoryTreeHelper(
        rawCategoryMapping,
        categoryId,
        output,
      );
    }
  });
  return output;
}

/**
 * The CategoryService is used to fetch the different Categories that
 * exist from the server. Right now the service only works with the
 * LinkedCategory model.
 */
class CategoryService extends CachedMapService<LinkedCategory>
  implements URIConverter {
  apiVersion: APIVersion = API_VERSION.V2;
  endpoint: string = 'query/categories';
  _httpService: HTTPService;

  constructor(httpService: HTTPService) {
    super();
    this._httpService = httpService;
  }

  buildCache(
    resolve: ResolveFn<LinkedCategory>,
    reject: RejectFn,
  ): Promise<Cache<LinkedCategory>> {
    return this._httpService
      .get(this.apiVersion, this.endpoint)
      .then(rawCategoryList => {
        // Build mapping from category ID to serialized category object.
        const rawCategoryMapping = {};
        rawCategoryList.forEach(rawCategory => {
          rawCategoryMapping[rawCategory.id] = rawCategory;
        });

        // Build full mapping from category ID to deserialized LinkedCategory
        // model.
        resolve(buildCategoryTree(rawCategoryMapping));
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

const CategoryServiceImpl: CategoryService = new CategoryService(APIService);
export default CategoryServiceImpl;
