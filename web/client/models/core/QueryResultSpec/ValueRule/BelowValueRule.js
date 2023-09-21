// @flow
import * as Zen from 'lib/Zen';
import I18N from 'lib/I18N';
import type { Serializable } from 'lib/Zen';
import type { TestableRule } from 'models/core/QueryResultSpec/ValueRule/TestableRule';

type Values = {
  value: number,
};

type SerializedBelowValueRule = {
  type: 'BELOW_VALUE',
  value: number,
};

/**
 * Test if a value is above another value
 */
class BelowValueRule extends Zen.BaseModel<BelowValueRule, Values>
  implements Serializable<SerializedBelowValueRule>, TestableRule {
  tag: 'BELOW_VALUE' = 'BELOW_VALUE';

  static deserialize(
    values: SerializedBelowValueRule,
  ): Zen.Model<BelowValueRule> {
    return BelowValueRule.create({ value: values.value });
  }

  testValue(val: ?number): boolean {
    if (val === null || val === undefined) {
      return false;
    }
    return val < this._.value();
  }

  getRuleString(): string {
    return `${I18N.textById('Values')} < ${this._.value()}`;
  }

  serialize(): SerializedBelowValueRule {
    return {
      type: this.tag,
      value: this._.value(),
    };
  }
}

export default ((BelowValueRule: $Cast): Class<Zen.Model<BelowValueRule>>);
