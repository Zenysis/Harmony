// @flow
import * as Zen from 'lib/Zen';
import DatasourceDigest from 'models/DataDigestApp/DatasourceDigest';
import Moment from 'models/core/wip/DateTime/Moment';
import memoizeOne from 'decorators/memoizeOne';
import { formatDate } from 'util/dateUtil';
import { sortAlphabetic } from 'util/arrayUtil';
import type { Deserializable } from 'lib/Zen';

type RequiredValues = {
  datasourceName: string,

  /**
   * A map of date to DatasourceDigest. Each key is a date string
   * in YYYYMMDD format.
   */
  digestsPerDate: Zen.Map<DatasourceDigest>,
};

type DerivedValues = {
  /**
   * Array of all available dates in descending order (most recent date
   * first)
   * */
  availableDates: $ReadOnlyArray<Moment>,
};

type SerializedDatasourceDigestCollection = {
  // dictionary of digests per date
  [dateYYYYMMDD: string]: {
    [filename: string]: string,
    ...,
  },
};

type DeserializationConfig = {
  datasourceName: string,
};

const DATASOURCE_DATE_FORMAT = 'YYYYMMDD';

/**
 * A DatasourceDigestCollection consists of a digest entry for every date
 * available.
 */
class DatasourceDigestCollection
  extends Zen.BaseModel<
    DatasourceDigestCollection,
    RequiredValues,
    {},
    DerivedValues,
  >
  implements
    Deserializable<
      SerializedDatasourceDigestCollection,
      DeserializationConfig,
    > {
  static derivedConfig: Zen.DerivedConfig<
    DatasourceDigestCollection,
    DerivedValues,
  > = {
    availableDates: [
      Zen.hasChanged('digestsPerDate'),
      digestCollection =>
        digestCollection
          .digestsPerDate()
          .keys()
          .sort((a, b) => sortAlphabetic(a, b, true))
          .map(dateStr => Moment.utc(dateStr)),
    ],
  };

  static deserialize(
    values: SerializedDatasourceDigestCollection,
    extraConfig: DeserializationConfig,
  ): Zen.Model<DatasourceDigestCollection> {
    const digestsPerDateMap = Zen.Map.create(values).map(
      (filenameMap, dateStr) =>
        DatasourceDigest.deserialize(filenameMap, {
          datasourceName: extraConfig.datasourceName,
          date: dateStr,
        }),
    );

    return DatasourceDigestCollection.create({
      datasourceName: extraConfig.datasourceName,
      digestsPerDate: digestsPerDateMap,
    });
  }

  /**
   * Set of all available dates as strings in YYYYMMDD format
   */
  @memoizeOne
  availableDateSet(): $ReadOnlySet<string> {
    return new Set(this._.digestsPerDate().keys());
  }

  getDigest(date: string | Moment): DatasourceDigest | void {
    const dateStr =
      typeof date === 'string'
        ? formatDate(date, DATASOURCE_DATE_FORMAT)
        : date.format(DATASOURCE_DATE_FORMAT);
    return this._.digestsPerDate().get(dateStr);
  }

  /**
   * Check if a datasource digest has a given date
   */
  hasDate(date: string | Moment): boolean {
    const dateStr =
      typeof date === 'string'
        ? formatDate(date, DATASOURCE_DATE_FORMAT)
        : date.format(DATASOURCE_DATE_FORMAT);
    return this.availableDateSet().has(dateStr);
  }

  /**
   * Get the datasource digest for the first date we have available
   */
  getFirstDatasourceDigest(): DatasourceDigest | void {
    return this.getDigest(this._.availableDates()[0]);
  }

  /**
   * Get all digests in order from most recent datasource to oldest
   */
  @memoizeOne
  getDigests(): Array<DatasourceDigest> {
    return this._.availableDates()
      .map(date => this.getDigest(date))
      .filter(Boolean);
  }
}

export default ((DatasourceDigestCollection: $Cast): Class<
  Zen.Model<DatasourceDigestCollection>,
>);
