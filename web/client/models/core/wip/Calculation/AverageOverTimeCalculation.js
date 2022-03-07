// @flow
import * as Zen from 'lib/Zen';
import QueryFilterUtil from 'models/core/wip/QueryFilter/QueryFilterUtil';
import type {
  QueryFilter,
  SerializedQueryFilter,
} from 'models/core/wip/QueryFilter/types';
import type { Serializable } from 'lib/Zen';

type Values = {
  filter: QueryFilter,
};

type SerializedAverageOverTimeCalculation = {
  type: 'AVERAGE_OVER_TIME',
  filter: SerializedQueryFilter,
};

/**
 * Scale an aggregated field by the number of days in the time bucket.
 *
 * This is commonly used for `population` style indicators where the full
 * population value is repeated every day over all time in the database. To get
 * the true population value for a given interval, we sum the population and
 * scale it by the number of days in that interval.
 */
class AverageOverTimeCalculation
  extends Zen.BaseModel<AverageOverTimeCalculation, Values>
  implements Serializable<SerializedAverageOverTimeCalculation> {
  tag: 'AVERAGE_OVER_TIME' = 'AVERAGE_OVER_TIME';

  static deserializeAsync(
    values: SerializedAverageOverTimeCalculation,
  ): Promise<Zen.Model<AverageOverTimeCalculation>> {
    return QueryFilterUtil.deserializeAsync(values.filter).then(filter =>
      AverageOverTimeCalculation.create({ filter }),
    );
  }

  static UNSAFE_deserialize(
    values: SerializedAverageOverTimeCalculation,
  ): Zen.Model<AverageOverTimeCalculation> {
    const filter = QueryFilterUtil.UNSAFE_deserialize(values.filter);
    return AverageOverTimeCalculation.create({ filter });
  }

  serialize(): SerializedAverageOverTimeCalculation {
    return {
      type: this.tag,
      filter: this._.filter().serialize(),
    };
  }
}

export default ((AverageOverTimeCalculation: $Cast): Class<
  Zen.Model<AverageOverTimeCalculation>,
>);
