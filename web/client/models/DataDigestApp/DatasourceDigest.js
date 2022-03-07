// @flow
import * as Zen from 'lib/Zen';
import Moment from 'models/core/wip/DateTime/Moment';
import memoizeOne from 'decorators/memoizeOne';
import type { Deserializable } from 'lib/Zen';

type RequiredValues = {
  datasourceName: string,
  date: Moment,

  /**
   * Map metaadata file names to their file paths. These files contain the actual
   * datasource digest metadata.
   * The filename maphere is of the form:
   * {
   *   'unmatched_locations.csv': file path,
   *   'mapped_locations.csv': file path,
   *   'metadata_digest_file.csv': file path,
   * }
   */
  filenameMap: Zen.Map<string>,
};

type SerializedDatasourceDigest = {
  [filename: string]: string, // map filename to file path
  ...,
};

type DeserializationConfig = {
  datasourceName: string,

  /** Date string in YYYYMMDD format */
  date: string,
};

// NOTE(pablo): it's not ideal that we are storing everything in CSVs and
// referring to them by filename, but since this tool is only internal, this
// is good enough for now. Ideally, this should be stored in postgres instead.
const UNMATCHED_LOCATIONS_CSV = 'unmatched_locations.csv';
const MAPPED_LOCATIONS_CSV = 'mapped_locations.csv';
const INDICATOR_DIGEST_CSV = 'metadata_digest_file.csv';

/**
 * This model contains the metadata for a datasource digest for a single date.
 * All metadata is held in different CSVs that we download.
 */
class DatasourceDigest extends Zen.BaseModel<DatasourceDigest, RequiredValues>
  implements Deserializable<SerializedDatasourceDigest, DeserializationConfig> {
  static deserialize(
    values: SerializedDatasourceDigest,
    extraConfig: DeserializationConfig,
  ): Zen.Model<DatasourceDigest> {
    return DatasourceDigest.create({
      date: Moment.utc(extraConfig.date),
      datasourceName: extraConfig.datasourceName,
      filenameMap: Zen.Map.create(values),
    });
  }

  @memoizeOne
  getStandardDateString(): string {
    return this._.date().format('YYYYMMDD');
  }

  @memoizeOne
  getReadableDateString(): string {
    return this._.date().format('MMMM D, YYYY');
  }

  hasMetadataFile(filename: string): boolean {
    return this._.filenameMap().has(filename);
  }

  hasUnmatchedLocationsData(): boolean {
    return this.hasMetadataFile(UNMATCHED_LOCATIONS_CSV);
  }

  hasMappedLocationsData(): boolean {
    return this.hasMetadataFile(MAPPED_LOCATIONS_CSV);
  }

  hasIndicatorDigestData(): boolean {
    return this.hasMetadataFile(INDICATOR_DIGEST_CSV);
  }

  getIndicatorDigestFilepath(): string | void {
    return this._.filenameMap().get(INDICATOR_DIGEST_CSV);
  }

  getMappedLocationsFilepath(): string | void {
    return this._.filenameMap().get(MAPPED_LOCATIONS_CSV);
  }

  getUnmatchedLocationsFilepath(): string | void {
    return this._.filenameMap().get(UNMATCHED_LOCATIONS_CSV);
  }
}

export default ((DatasourceDigest: $Cast): Class<Zen.Model<DatasourceDigest>>);
