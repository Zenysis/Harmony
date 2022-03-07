// @flow
import Promise from 'bluebird';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import APIService, { API_VERSION } from 'services/APIService';
import DatasourceDigest from 'models/DataDigestApp/DatasourceDigest';
import DatasourceDigestTree from 'models/DataDigestApp/DatasourceDigestTree';
import IndicatorDigestData from 'models/DataDigestApp/IndicatorDigestData';
import LocationsDigestData from 'models/DataDigestApp/LocationsDigestData';
import PipelineDigest from 'models/DataDigestApp/PipelineDigest';
import type Field from 'models/core/wip/Field';
import type { Cache } from 'services/wip/CachedMapService';
import type { HTTPService } from 'services/APIService';

// keep a cache for all digest data retrieved from different s3 files
const DATASOURCE_DIGEST_FILE_CACHE: Map<
  string,
  Array<Array<string>>,
> = new Map();
const PIPELINE_DIGEST_CACHE: Map<number, PipelineDigest> = new Map();

/**
 * DimensionService is used to perform CRUD operations on Dimension model
 * for indicator management.
 */
class DataDigestService {
  _httpService: HTTPService;
  constructor(httpService: HTTPService) {
    this._httpService = httpService;
  }

  /**
   * Returns the indicator digest data for a given DatasourceDigest.
   * Returns undefined if no indicator digest data could be found.
   */
  getIndicatorDigestData(
    digest: DatasourceDigest,
    fieldMap: $ReadOnly<Cache<Field>>,
  ): Promise<IndicatorDigestData | void> {
    const filepath = digest.getIndicatorDigestFilepath();
    if (filepath) {
      return this.getDataDigestFile(filepath).then(rows =>
        IndicatorDigestData.deserialize(rows, fieldMap, {
          filepath,
          datasourceName: digest.datasourceName(),
        }),
      );
    }
    return Promise.resolve(undefined);
  }

  /**
   * Returns either the unmatched locations data or the mapped locations data
   * for a given DatasourceDigest.
   * Returns undefined if no locations data could be found.
   *
   * @param {DatasourceDigest} digest The DatasourceDigest object we want to
   * pull location data from.
   * @param {'mapped' | 'unmatched'} matchState Whether or not to pull mapped
   * or unmatched location data.
   * @returns {LocationsDigestData | void}
   */
  _getLocationsData(
    digest: DatasourceDigest,
    matchState: 'mapped' | 'unmatched',
  ): Promise<LocationsDigestData | void> {
    const filepath =
      matchState === 'mapped'
        ? digest.getMappedLocationsFilepath()
        : digest.getUnmatchedLocationsFilepath();
    if (filepath) {
      return this.getDataDigestFile(filepath).then(rows =>
        LocationsDigestData.deserialize(rows, {
          filepath,
          datasourceName: digest.datasourceName(),
          treatAllLocationsAsMapped: matchState === 'mapped',
        }),
      );
    }
    return Promise.resolve(undefined);
  }

  /**
   * Returns the unmatched location data for a given DatasourceDigest.
   * Returns undefined if no unmatched locations data could be found.
   *
   * @param {DatasourceDigest} digest The DatasourceDigest object we want to
   * pull location data from.
   * @returns {LocationsDigestData | void}
   */
  getUnmatchedLocationsData(
    digest: DatasourceDigest,
  ): Promise<LocationsDigestData | void> {
    return this._getLocationsData(digest, 'unmatched');
  }

  /**
   * Returns the mapped locations data (i.e. all locations with a correct match)
   * for a given DatasourceDigest.
   * Returns undefined if no mapped locations data could be found.
   *
   * @param {DatasourceDigest} digest The DatasourceDigest object we want to
   * pull location data from.
   * @returns {LocationsDigestData | void}
   */
  getMappedLocationsData(
    digest: DatasourceDigest,
  ): Promise<LocationsDigestData | void> {
    return this._getLocationsData(digest, 'mapped');
  }

  /**
   * Download any data digest CSV from s3.
   * @return {Promise<Array<Array<string>>>} A promise containing all the CSV
   * data as an array of rows. Each value is represented as a string.
   */
  getDataDigestFile(fileKey: string): Promise<Array<Array<string>>> {
    if (DATASOURCE_DIGEST_FILE_CACHE.has(fileKey)) {
      return Promise.resolve(DATASOURCE_DIGEST_FILE_CACHE.get(fileKey) || []);
    }

    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.V2, '/data_digest/object', fileKey)
        .then(digestFile => {
          DATASOURCE_DIGEST_FILE_CACHE.set(fileKey, digestFile);
          return resolve(digestFile);
        })
        .catch(error => reject(error));
    });
  }

  /**
   * Return the DatasourceDigestTree which is a collection of all
   * data digests for datasource for each date.
   */
  getDatasourceDigestTree(): Promise<DatasourceDigestTree> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, '/data_digest/tree')
        .then((digestTree: Zen.Serialized<DatasourceDigestTree>) => {
          resolve(DatasourceDigestTree.deserialize(digestTree));
        })
        .catch(error => reject(error));
    });
  }

  getCanonicalMappings(): Promise<Zen.Map<string>> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, '/data_digest/canonical_mappings')
        .then(canonicalMappings => {
          return resolve(Zen.Map.create(canonicalMappings));
        })
        .catch(error => reject(error));
    });
  }

  /**
   * Get the PipelineDigest for the last X weeks, where X is `lookbackWeeks`.
   */
  getPipelineDigest(lookbackWeeks: number): Promise<PipelineDigest> {
    if (PIPELINE_DIGEST_CACHE.has(lookbackWeeks)) {
      const digest = PIPELINE_DIGEST_CACHE.get(lookbackWeeks);
      invariant(digest, 'Pipeline digest should exist');
      return Promise.resolve(digest);
    }

    const reqParams = new URLSearchParams();
    reqParams.set('lookbackWeeks', String(lookbackWeeks));

    return new Promise((resolve, reject) => {
      this._httpService
        .get(
          API_VERSION.V2,
          `/pipeline_run_metadata/digest_overview?${reqParams.toString()}`,
        )
        .then(digestOverview => {
          const digest = PipelineDigest.deserialize(digestOverview);
          PIPELINE_DIGEST_CACHE.set(lookbackWeeks, digest);
          resolve(digest);
        })
        .catch(error => reject(error));
    });
  }
}

export default (new DataDigestService(APIService): DataDigestService);
