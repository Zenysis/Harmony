// @flow
import AboveAverageRule from 'models/core/QueryResultSpec/ValueRule/AboveAverageRule';
import AboveValueRule from 'models/core/QueryResultSpec/ValueRule/AboveValueRule';
import BelowAverageRule from 'models/core/QueryResultSpec/ValueRule/BelowAverageRule';
import BelowValueRule from 'models/core/QueryResultSpec/ValueRule/BelowValueRule';
import BottomRule from 'models/core/QueryResultSpec/ValueRule/BottomRule';
import EqualToNullRule from 'models/core/QueryResultSpec/ValueRule/EqualToNullRule';
import EqualToValueRule from 'models/core/QueryResultSpec/ValueRule/EqualToValueRule';
import EqualToZeroRule from 'models/core/QueryResultSpec/ValueRule/EqualToZeroRule';
import InQuantileRule from 'models/core/QueryResultSpec/ValueRule/InQuantileRule';
import InValueRangeRule from 'models/core/QueryResultSpec/ValueRule/InValueRangeRule';
import IsFalseRule from 'models/core/QueryResultSpec/ValueRule/IsFalseRule';
import IsTrueRule from 'models/core/QueryResultSpec/ValueRule/IsTrueRule';
import NotANumberRule from 'models/core/QueryResultSpec/ValueRule/NotANumberRule';
import TopRule from 'models/core/QueryResultSpec/ValueRule/TopRule';
import type {
  SerializedValueRule,
  ValueRule,
} from 'models/core/QueryResultSpec/ValueRule/types';
import type { TestableRule } from 'models/core/QueryResultSpec/ValueRule/TestableRule';

export default class ValueRuleUtil {
  static deserialize(rule: SerializedValueRule): ValueRule {
    switch (rule.type) {
      case 'ABOVE_AVERAGE':
        return AboveAverageRule.create({});
      case 'ABOVE_VALUE':
        return AboveValueRule.create({ value: rule.value });
      case 'BELOW_AVERAGE':
        return BelowAverageRule.create({});
      case 'BELOW_VALUE':
        return BelowValueRule.create({ value: rule.value });
      case 'EQUAL_TO_VALUE':
        return EqualToValueRule.create({ value: rule.value });
      case 'BOTTOM':
        return BottomRule.create({ n: rule.n });
      case 'EQUAL_TO_NULL':
        return EqualToNullRule.create({});
      case 'NOT_A_NUMBER':
        return NotANumberRule.create({});
      case 'EQUAL_TO_ZERO':
        return EqualToZeroRule.create({});
      case 'IN_QUANTILE':
        return InQuantileRule.create({
          n: rule.n,
          percentile: rule.percentile,
        });
      case 'IN_VALUE_RANGE':
        return InValueRangeRule.create({
          endValue: rule.endValue,
          startValue: rule.startValue,
        });
      case 'IS_FALSE':
        return IsFalseRule.create({});
      case 'IS_TRUE':
        return IsTrueRule.create({});
      case 'TOP':
        return TopRule.create({ n: rule.n });
      default:
        throw new Error(
          `Invalid rule type found when deserializing: ${rule.type}`,
        );
    }
  }

  static testValue(
    rule: TestableRule,
    val: ?number,
    allValues: $ReadOnlyArray<?number>,
  ): boolean {
    return rule.testValue(val, allValues);
  }

  static getRuleString(
    rule: TestableRule,
    allValues: $ReadOnlyArray<?number>,
  ): string {
    return rule.getRuleString(allValues);
  }
}
