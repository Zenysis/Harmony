// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';
import type { TestableRule } from 'models/core/QueryResultSpec/ValueRule/TestableRule';

type Values = {
  value: number,
};

type SerializedAboveValueRule = {
  type: 'ABOVE_VALUE',
  value: number,
};

const TEXT = t('models.core.QueryResultSpec.ValueRule');

/**
 * Test if a value is above another value
 */
class AboveValueRule extends Zen.BaseModel<AboveValueRule, Values>
  implements Serializable<SerializedAboveValueRule>, TestableRule {
  tag: 'ABOVE_VALUE' = 'ABOVE_VALUE';

  static deserialize(
    values: SerializedAboveValueRule,
  ): Zen.Model<AboveValueRule> {
    return AboveValueRule.create({ value: values.value });
  }

  testValue(val: ?number): boolean {
    if (val === null || val === undefined) {
      return false;
    }
    return val > this._.value();
  }

  getRuleString(): string {
    return `${TEXT.values} > ${this._.value()}`;
  }

  serialize(): SerializedAboveValueRule {
    return {
      type: this.tag,
      value: this._.value(),
    };
  }
}

export default ((AboveValueRule: $Cast): Class<Zen.Model<AboveValueRule>>);
