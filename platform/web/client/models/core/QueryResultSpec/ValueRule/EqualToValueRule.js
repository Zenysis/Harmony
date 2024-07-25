// @flow
import * as Zen from 'lib/Zen';
import I18N from 'lib/I18N';
import type { Serializable } from 'lib/Zen';
import type { TestableRule } from 'models/core/QueryResultSpec/ValueRule/TestableRule';

type Values = {
  value: number,
};

type SerializedEqualToValueRule = {
  type: 'EQUAL_TO_VALUE',
  value: number,
};

/**
 * Test if a value is equal to another value
 */
class EqualToValueRule extends Zen.BaseModel<EqualToValueRule, Values>
  implements Serializable<SerializedEqualToValueRule>, TestableRule {
  tag: 'EQUAL_TO_VALUE' = 'EQUAL_TO_VALUE';

  static deserialize(
    values: SerializedEqualToValueRule,
  ): Zen.Model<EqualToValueRule> {
    return EqualToValueRule.create({ value: values.value });
  }

  testValue(val: ?number): boolean {
    if (val === null || val === undefined) {
      return false;
    }
    return val === this._.value();
  }

  getRuleString(): string {
    return `${I18N.text('Values')} === ${this._.value()}`;
  }

  serialize(): SerializedEqualToValueRule {
    return {
      type: this.tag,
      value: this._.value(),
    };
  }
}

export default ((EqualToValueRule: $Cast): Class<Zen.Model<EqualToValueRule>>);
