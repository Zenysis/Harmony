// @flow
import * as Zen from 'lib/Zen';
import { sortValuesAsc } from 'models/core/QueryResultSpec/ValueRule/rulesUtil';
import type { Serializable } from 'lib/Zen';
import type { TestableRule } from 'models/core/QueryResultSpec/ValueRule/TestableRule';

type Values = {
  n: number,
};

type SerializedTopRule = {
  type: 'TOP',
  n: number,
};

const TEXT_PATH = 'models.core.QueryResultSpec.ValueRule';

/**
 * Test if a value is in the top N values of its array.
 * This allows values that are also *equal* to the top Nth value (it is not a
 * strictly greater-than operation).
 */
class TopRule extends Zen.BaseModel<TopRule, Values>
  implements Serializable<SerializedTopRule>, TestableRule {
  tag: 'TOP' = 'TOP';

  static deserialize(values: SerializedTopRule): Zen.Model<TopRule> {
    return TopRule.create({ n: values.n });
  }

  _getTopValue(allValues: $ReadOnlyArray<?number>): number {
    const sortedValues = sortValuesAsc(allValues);
    const n = this._.n();
    if (n >= sortedValues.length) {
      return sortedValues[0];
    }
    return sortedValues[sortedValues.length - this._.n()];
  }

  testValue(val: ?number, allValues: $ReadOnlyArray<?number>): boolean {
    if (val === null || val === undefined) {
      return false;
    }
    return val >= this._getTopValue(allValues);
  }

  getRuleString(): string {
    return t('top', {
      scope: TEXT_PATH,
      num: this._.n().toString(),
    });
  }

  serialize(): SerializedTopRule {
    return {
      type: this.tag,
      n: this._.n(),
    };
  }
}

export default ((TopRule: $Cast): Class<Zen.Model<TopRule>>);
