// @flow
import * as Zen from 'lib/Zen';
import Moment from 'models/core/wip/DateTime/Moment';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  end: Moment,
  start: Moment,
};

type SerializedTimeInterval = {
  end: string,
  start: string,
};

/**
 * The TimeInterval model represents a datetime range spanning
 * start (inclusive) to end (exclusive).
 */
class TimeInterval extends Zen.BaseModel<TimeInterval, RequiredValues>
  implements Serializable<SerializedTimeInterval> {
  static DEFAULT_DATE_FORMAT: string = 'YYYY-MM-DD';

  /**
   * Create a TimeInterval from start/end date strings.
   */
  static fromDateStrings(
    start: string,
    end: string,
    format?: string = TimeInterval.DEFAULT_DATE_FORMAT,
  ): Zen.Model<TimeInterval> {
    const startMoment = Moment.utc(start, format);
    const endMoment = Moment.utc(end, format);
    return TimeInterval.create({ end: endMoment, start: startMoment });
  }

  static deserialize(values: SerializedTimeInterval): Zen.Model<TimeInterval> {
    const { end, start } = values;
    return TimeInterval.fromDateStrings(
      start,
      end,
      TimeInterval.DEFAULT_DATE_FORMAT,
    );
  }

  serialize(): SerializedTimeInterval {
    const startStr = this._.start().format(TimeInterval.DEFAULT_DATE_FORMAT);
    const endStr = this._.end().format(TimeInterval.DEFAULT_DATE_FORMAT);
    return { end: endStr, start: startStr };
  }

  isSame(timeInterval: Zen.Model<TimeInterval>): boolean {
    return (
      this._.start() === timeInterval.start() &&
      this._.end() === timeInterval.end()
    );
  }
}

export default ((TimeInterval: $Cast): Class<Zen.Model<TimeInterval>>);
