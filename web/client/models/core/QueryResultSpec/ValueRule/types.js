// @flow
import * as Zen from 'lib/Zen';
import type AboveAverageRule from 'models/core/QueryResultSpec/ValueRule/AboveAverageRule';
import type AboveValueRule from 'models/core/QueryResultSpec/ValueRule/AboveValueRule';
import type BelowAverageRule from 'models/core/QueryResultSpec/ValueRule/BelowAverageRule';
import type BelowValueRule from 'models/core/QueryResultSpec/ValueRule/BelowValueRule';
import type BottomRule from 'models/core/QueryResultSpec/ValueRule/BottomRule';
import type EqualToNullRule from 'models/core/QueryResultSpec/ValueRule/EqualToNullRule';
import type EqualToZeroRule from 'models/core/QueryResultSpec/ValueRule/EqualToZeroRule';
import type InQuantileRule from 'models/core/QueryResultSpec/ValueRule/InQuantileRule';
import type InValueRangeRule from 'models/core/QueryResultSpec/ValueRule/InValueRangeRule';
import type IsFalseRule from 'models/core/QueryResultSpec/ValueRule/IsFalseRule';
import type IsTrueRule from 'models/core/QueryResultSpec/ValueRule/IsTrueRule';
import type TopRule from 'models/core/QueryResultSpec/ValueRule/TopRule';

type ValueRuleMap = {
  ABOVE_AVERAGE: AboveAverageRule,
  ABOVE_VALUE: AboveValueRule,
  BELOW_AVERAGE: BelowAverageRule,
  BELOW_VALUE: BelowValueRule,
  BOTTOM: BottomRule,
  EQUAL_TO_NULL: EqualToNullRule,
  EQUAL_TO_ZERO: EqualToZeroRule,
  IN_QUANTILE: InQuantileRule,
  IN_VALUE_RANGE: InValueRangeRule,
  IS_FALSE: IsFalseRule,
  IS_TRUE: IsTrueRule,
  TOP: TopRule,
};

export type ValueRuleType = $Keys<ValueRuleMap>;
export type ValueRule = $Values<ValueRuleMap>;

export type SerializedValueRule = Zen.Serialized<TopRule>;

export interface TestableRule {
  /**
   * This function takes a value and an array of values and returns true
   * if this value passes whatever rule the implementing class represents.
   *
   * NOTE(pablo): try to keep this function as an O(1) operation. Any
   * computations that are O(N) should be extracted to helper functions in
   * rulesUtil.js and should use a cache so results can be memoized.
   */
  testValue(val: ?number, allValues: $ReadOnlyArray<?number>): boolean;

  /**
   * Convert this rule to a string (e.g. 'Values > 10') to be rendered in places
   * like the Map legend.
   *
   * Some rules need an `allValues` array in order to be calculated
   * (e.g. the AboveAverageRule needs all values in order to calculate the
   * average, otherwise the string cannot be rendered)
   */
  getRuleString(allValues: $ReadOnlyArray<?number>): string;
}
