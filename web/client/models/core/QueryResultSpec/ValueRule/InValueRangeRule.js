// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';
import type { TestableRule } from 'models/core/QueryResultSpec/ValueRule/TestableRule';

type Values = {
  endValue: number,
  startValue: number,
};

type SerializedInValueRangeRule = {
  endValue: number,
  startValue: number,
  type: 'IN_VALUE_RANGE',
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
      endValue: values.endValue,
      startValue: values.startValue,
    });
  }

  testValue(val: ?number): boolean {
    if (val === null || val === undefined) {
      return false;
    }

    return val >= this._.startValue() && val <= this._.endValue();
  }

  getRuleString(): string {
    const { endValue, startValue } = this.modelValues();
    return `${startValue} - ${endValue}`;
  }

  serialize(): SerializedInValueRangeRule {
    return {
      endValue: this._.endValue(),
      startValue: this._.startValue(),
      type: this.tag,
    };
  }
}

export default ((InValueRangeRule: $Cast): Class<Zen.Model<InValueRangeRule>>);
