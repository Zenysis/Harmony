// @flow
import * as Zen from 'lib/Zen';
import DatasetService from 'services/wip/DatasetService';
import TimeInterval from 'models/core/wip/DateTime/TimeInterval';
import type { JSONRef } from 'services/types/api';

type RequiredValues = {
  id: string,
  name: string,
};

type DefaultValues = {
  +description: string,

  /** Optional list of time intervals this Dataset contains data for */
  +validIntervals: $ReadOnlyArray<TimeInterval>,
};

type SerializedDataset = JSONRef;

/**
 * The Dataset model represents the original source of a piece of data
 * in the database. It normally represents the pipeline source that produced
 * a set of rows in the database.
 */
class Dataset extends Zen.BaseModel<Dataset, RequiredValues, DefaultValues> {
  static defaultValues: DefaultValues = {
    description: '',
    validIntervals: [],
  };

  static deserializeAsync(
    values: SerializedDataset,
  ): Promise<Zen.Model<Dataset>> {
    return DatasetService.forceGet(DatasetService.convertURIToID(values.$ref));
  }

  static UNSAFE_deserialize(values: SerializedDataset): Zen.Model<Dataset> {
    return DatasetService.UNSAFE_forceGet(
      DatasetService.convertURIToID(values.$ref),
    );
  }

  serialize(): SerializedDataset {
    return {
      $ref: DatasetService.convertIDToURI(this._.id()),
    };
  }
}

export default ((Dataset: $Cast): Class<Zen.Model<Dataset>>);
