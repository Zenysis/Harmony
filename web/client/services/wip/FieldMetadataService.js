// @flow
import Promise from 'bluebird';

import APIService, { API_VERSION } from 'services/APIService';
import CachedMapService from 'services/wip/CachedMapService';
import CategoryService from 'services/wip/CategoryService';
import Dataset from 'models/core/wip/Dataset';
import DatasetService from 'services/wip/DatasetService';
import Dimension from 'models/core/wip/Dimension';
import DimensionService from 'services/wip/DimensionService';
// No way to avoid this circular dependency unfortunately.
// eslint-disable-next-line import/no-cycle
import FieldMetadata from 'models/core/wip/FieldMetadata';
import LinkedCategory from 'models/core/wip/LinkedCategory';
import memoizeOne from 'decorators/memoizeOne';
import { convertIDToURI, convertURIToID } from 'services/wip/util';
import type { APIVersion, HTTPService } from 'services/APIService';
import type { Cache, RejectFn, ResolveFn } from 'services/wip/CachedMapService';
import type { URI, URIConverter } from 'services/types/api';

/**
 * The FieldMetadataService is used to retrieve all the calculable FieldMetadata objects that exist.
 */
class FieldMetadataService extends CachedMapService<FieldMetadata>
  implements URIConverter {
  apiVersion: APIVersion = API_VERSION.V2;
  endpoint: string = 'query/field_metadata';
  _httpService: HTTPService;

  constructor(httpService: HTTPService) {
    super();
    this._httpService = httpService;
  }

  buildCache(
    resolve: ResolveFn<FieldMetadata>,
    reject: RejectFn,
  ): Promise<Cache<FieldMetadata>> {
    // Performance optimization: preload services needed during deserialization
    // of the field metadata so that we can use the
    // FieldMetadata.UNSAFE_deserialize synchronous deserialization method.
    // If we use FieldMetadata.deserializeAsync, thousands of promises will be
    // created, and the resolution of all those promises is slow and noticeable.
    // Using the UNSAFE_deserialize method is preferred in this case.
    const promise = Promise.all([
      this._httpService.get(this.apiVersion, this.endpoint),
      CategoryService.getAll(),
      DatasetService.getAll(),
      DimensionService.getAll(),
    ]);
    return promise
      .then(([rawFieldMetadataList]) => {
        const fieldMetadataMappingCache = {};
        // NOTE(nina): When we called serialize() on the frontend
        // FieldMetadata model, we stored it as a ref, so that we wouldn't
        // ever point to a category or source id that no longer exists.
        // If we called UNSAFE_deserialize, this would call UNSAFE_forceGet
        // and will result in infinite recursion/immediate crash. Models
        // that only store the JSONRef as the serialized value must
        // instead call [Model].create(), and deserialize the inner
        // properties as needed. EX: DatasetService does this as well.
        // You can go to localhost:5000/api2/query/field_metadata to see what
        // gets returned as the rawFieldMetadataList.
        rawFieldMetadataList.forEach(
          ({ constituents, description, id, ...serializedFieldMetadata }) => {
            // NOTE(stephen): Calling `convertURIToID` directly with the fields
            // endpoint referenced because we can't import Field service since it
            // would introduce a circular  dependency.
            const constituentIds = constituents.map(({ $ref }) =>
              convertURIToID($ref, this.apiVersion, 'query/fields'),
            );

            const fieldMetadata = FieldMetadata.create({
              constituentIds,
              description,
              id,
              category: LinkedCategory.UNSAFE_deserialize(
                serializedFieldMetadata.category,
              ),
              dimensions: serializedFieldMetadata.dimensions.map(
                Dimension.UNSAFE_deserialize,
              ),
              source: Dataset.UNSAFE_deserialize(
                serializedFieldMetadata.source,
              ),
            });
            fieldMetadataMappingCache[fieldMetadata.id()] = fieldMetadata;
          },
        );
        resolve(fieldMetadataMappingCache);
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
   * Return a default FieldMetadata instance to use.
   */
  @memoizeOne
  getDefault(): FieldMetadata {
    return FieldMetadata.create({
      category: LinkedCategory.create({
        id: '__default_category__',
        name: '',
      }),
      dimensions: [],
      id: '__default_field_metadata__',
      source: Dataset.create({
        id: '__default_dataset__',
        name: '',
      }),
    });
  }
}

export default (new FieldMetadataService(APIService): FieldMetadataService);
