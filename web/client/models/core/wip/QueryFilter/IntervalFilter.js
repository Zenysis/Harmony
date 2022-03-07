// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import TimeInterval from 'models/core/wip/DateTime/TimeInterval';
import type { Serializable } from 'lib/Zen';

type Values = {
  interval: TimeInterval,
};

type SerializedIntervalFilter = {
  ...Zen.Serialized<TimeInterval>,
  type: 'INTERVAL',
};

class IntervalFilter extends Zen.BaseModel<IntervalFilter, Values>
  implements Serializable<SerializedIntervalFilter> {
  tag: 'INTERVAL' = 'INTERVAL';

  static deserialize(
    values: SerializedIntervalFilter,
  ): Zen.Model<IntervalFilter> {
    const { start, end } = values;
    return IntervalFilter.create({
      interval: TimeInterval.deserialize({ start, end }),
    });
  }

  static deserializeAsync(
    values: SerializedIntervalFilter,
  ): Promise<Zen.Model<IntervalFilter>> {
    return Promise.resolve(IntervalFilter.deserialize(values));
  }

  static UNSAFE_deserialize(
    values: SerializedIntervalFilter,
  ): Zen.Model<IntervalFilter> {
    return IntervalFilter.deserialize(values);
  }

  serialize(): SerializedIntervalFilter {
    return {
      type: this.tag,
      ...this._.interval().serialize(),
    };
  }
}

export default ((IntervalFilter: $Cast): Class<Zen.Model<IntervalFilter>>);
