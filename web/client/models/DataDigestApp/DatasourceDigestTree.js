// @flow
import * as Zen from 'lib/Zen';
import DatasourceDigest from 'models/DataDigestApp/DatasourceDigest';
import DatasourceDigestCollection from 'models/DataDigestApp/DatasourceDigestCollection';
import Moment from 'models/core/wip/DateTime/Moment';
import { sortAlphabetic } from 'util/arrayUtil';
import type { Deserializable } from 'lib/Zen';

type RequiredValues = {
  /** A map of datasource name to a DatasourceDigestCollection model */
  datasourceDigests: Zen.Map<DatasourceDigestCollection>,
};

type DerivedValues = {
  /** All datasource names available in this collection */
  datasourceNames: $ReadOnlyArray<string>,
};

type SerializedDatasourceDigestRepository = {
  +[datasourceName: string]: {
    [dateYYYYMMDD: string]: {
      /**
       * The filename object here is of the form:
       * {
       *   'unmatched_locations.csv': file path,
       *   'mapped_locations.csv': file path,
       *   'metadata_digest_file.csv': file path,
       * }
       */
      [filename: string]: string,
      ...,
    },
    ...,
  },
  ...,
};

/**
 * This model powers the Datasource Overview. The DatasourceDigestTree
 * contains a DatasourceDigestCollection for every datasource name, which in turn
 * contains a DatasourceDigest for every date.
 */
class DatasourceDigestTree
  extends Zen.BaseModel<DatasourceDigestTree, RequiredValues, {}, DerivedValues>
  implements Deserializable<SerializedDatasourceDigestRepository> {
  static derivedConfig: Zen.DerivedConfig<
    DatasourceDigestTree,
    DerivedValues,
  > = {
    datasourceNames: [
      Zen.hasChanged('datasourceDigests'),
      repository =>
        repository
          .datasourceDigests()
          .keys()
          .sort(sortAlphabetic),
    ],
  };

  static deserialize(
    values: SerializedDatasourceDigestRepository,
  ): Zen.Model<DatasourceDigestTree> {
    return DatasourceDigestTree.create({
      datasourceDigests: Zen.Map.create(values).map(
        (digestCollection, datasourceName) =>
          DatasourceDigestCollection.deserialize(digestCollection, {
            datasourceName,
          }),
      ),
    });
  }

  getDatasourceDigestCollection(
    datasourceName: string,
  ): DatasourceDigestCollection {
    return this._.datasourceDigests().forceGet(datasourceName);
  }

  getDatasourceDigest(
    datasourceName: string,
    date: string | Moment,
  ): DatasourceDigest | void {
    return this.getDatasourceDigestCollection(datasourceName).getDigest(date);
  }

  /**
   * Get the datasource digest collection for the first datasource name in our
   * list
   */
  getFirstDatasourceDigestCollection(): DatasourceDigestCollection {
    return this.getDatasourceDigestCollection(this._.datasourceNames()[0]);
  }
}

export default ((DatasourceDigestTree: $Cast): Class<
  Zen.Model<DatasourceDigestTree>,
>);
