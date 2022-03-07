// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';
import type { TestableRule } from 'models/core/QueryResultSpec/ValueRule/TestableRule';

type Values = {
  startValue: number,
  endValue: number,
};

type SerializedInValueRangeRule = {
  type: 'IN_VALUE_RANGE',
  startValue: number,
  endValue: number,
};

/**
 * Test if a value is within a range. The range includes the startValue and
 * includes the endValue: startValue <= x <= endValue
 */
class InValueRangeRule extends Zen.BaseModel<InValueRangeRule, Values>
  implements Serializable<SerializedInValueRangeRule>, TestableRule {
  tag: 'IN_VALUE_RANGE' = 'IN_VALUE_RANGE';

  static deserialize(
    values: SerializedInValueRangeRule,
  ): Zen.Model<InValueRangeRule> {
    return InValueRangeRule.create({
      startValue: values.startValue,
      endValue: values.endValue,
    });
  }

  testValue(val: ?number): boolean {
    if (val === null || val === undefined) {
      return false;
    }

    return val >= this._.startValue() && val <= this._.endValue();
  }

  getRuleString(): string {
    const { startValue, endValue } = this.modelValues();
    return `${startValue} - ${endValue}`;
  }

  serialize(): SerializedInValueRangeRule {
    return {
      type: this.tag,
      startValue: this._.startValue(),
      endValue: this._.endValue(),
    };
  }
}

export default ((InValueRangeRule: $Cast): Class<Zen.Model<InValueRangeRule>>);
