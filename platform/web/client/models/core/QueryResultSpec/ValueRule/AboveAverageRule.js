// @flow
import * as Zen from 'lib/Zen';
import I18N from 'lib/I18N';
import { getAverage } from 'models/core/QueryResultSpec/ValueRule/rulesUtil';
import type { Serializable } from 'lib/Zen';
import type { TestableRule } from 'models/core/QueryResultSpec/ValueRule/TestableRule';

type SerializedAboveAverageRule = {
  type: 'ABOVE_AVERAGE',
};

/**
 * Test if a value is above the average value of an array of numbers.
 */
class AboveAverageRule extends Zen.BaseModel<AboveAverageRule, {}>
  implements Serializable<SerializedAboveAverageRule>, TestableRule {
  tag: 'ABOVE_AVERAGE' = 'ABOVE_AVERAGE';

  static deserialize(): Zen.Model<AboveAverageRule> {
    return AboveAverageRule.create({});
  }

  testValue(val: ?number, allValues: $ReadOnlyArray<?number>): boolean {
    if (val === null || val === undefined) {
      return false;
    }
    const avg = getAverage(allValues);
    return val > avg;
  }

  getRuleString(allValues: $ReadOnlyArray<?number>): string {
    return I18N.text('Above average (> %(average)s)', {
      average: getAverage(allValues).toFixed(2),
    });
  }

  serialize(): SerializedAboveAverageRule {
    return {
      type: this.tag,
    };
  }
}

export default ((AboveAverageRule: $Cast): Class<Zen.Model<AboveAverageRule>>);
