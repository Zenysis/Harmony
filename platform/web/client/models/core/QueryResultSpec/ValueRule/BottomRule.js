// @flow
import * as Zen from 'lib/Zen';
import I18N from 'lib/I18N';
import { sortValuesAsc } from 'models/core/QueryResultSpec/ValueRule/rulesUtil';
import type { Serializable } from 'lib/Zen';
import type { TestableRule } from 'models/core/QueryResultSpec/ValueRule/TestableRule';

type Values = {
  n: number,
};

type SerializedBottomRule = {
  n: number,
  type: 'BOTTOM',
};

/**
 * Test if a value is in the bottom N values of its array.
 * This allows values that are also *equal* to the bottom Nth value (it is not a
 * strictly less-than operation).
 */
class BottomRule extends Zen.BaseModel<BottomRule, Values>
  implements Serializable<SerializedBottomRule>, TestableRule {
  tag: 'BOTTOM' = 'BOTTOM';

  static deserialize(values: SerializedBottomRule): Zen.Model<BottomRule> {
    return BottomRule.create({ n: values.n });
  }

  _getBottomValue(allValues: $ReadOnlyArray<?number>): number {
    const sortedValues = sortValuesAsc(allValues);
    const n = this._.n();
    if (n >= sortedValues.length) {
      return sortedValues[sortedValues.length - 1];
    }
    return sortedValues[this._.n() - 1];
  }

  testValue(val: ?number, allValues: $ReadOnlyArray<?number>): boolean {
    if (val === null || val === undefined) {
      return false;
    }
    return val <= this._getBottomValue(allValues);
  }

  getRuleString(): string {
    return I18N.text('Bottom %(num)s', {
      num: this._.n().toString(),
    });
  }

  serialize(): SerializedBottomRule {
    return {
      n: this._.n(),
      type: this.tag,
    };
  }
}

export default ((BottomRule: $Cast): Class<Zen.Model<BottomRule>>);
