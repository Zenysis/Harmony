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
export type SerializedValueRule =
  | Zen.Serialized<AboveAverageRule>
  | Zen.Serialized<AboveValueRule>
  | Zen.Serialized<BelowAverageRule>
  | Zen.Serialized<BelowValueRule>
  | Zen.Serialized<BottomRule>
  | Zen.Serialized<EqualToNullRule>
  | Zen.Serialized<EqualToZeroRule>
  | Zen.Serialized<InQuantileRule>
  | Zen.Serialized<InValueRangeRule>
  | Zen.Serialized<IsFalseRule>
  | Zen.Serialized<IsTrueRule>
  | Zen.Serialized<TopRule>;
