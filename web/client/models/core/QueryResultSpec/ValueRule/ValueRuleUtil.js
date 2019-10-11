// @flow
import AboveAverageRule from 'models/core/QueryResultSpec/ValueRule/AboveAverageRule';
import AboveValueRule from 'models/core/QueryResultSpec/ValueRule/AboveValueRule';
import BelowAverageRule from 'models/core/QueryResultSpec/ValueRule/BelowAverageRule';
import BelowValueRule from 'models/core/QueryResultSpec/ValueRule/BelowValueRule';
import BottomRule from 'models/core/QueryResultSpec/ValueRule/BottomRule';
import EqualToNullRule from 'models/core/QueryResultSpec/ValueRule/EqualToNullRule';
import EqualToZeroRule from 'models/core/QueryResultSpec/ValueRule/EqualToZeroRule';
import InQuantileRule from 'models/core/QueryResultSpec/ValueRule/InQuantileRule';
import InValueRangeRule from 'models/core/QueryResultSpec/ValueRule/InValueRangeRule';
import IsFalseRule from 'models/core/QueryResultSpec/ValueRule/IsFalseRule';
import IsTrueRule from 'models/core/QueryResultSpec/ValueRule/IsTrueRule';
import TopRule from 'models/core/QueryResultSpec/ValueRule/TopRule';
import type { FilterRule } from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/types';
import type { ValueRule } from 'models/core/QueryResultSpec/ValueRule/types';

export default class ValueRuleUtil {
  static createFromLegacyFilterRule(
    filterModalRule: FilterRule,
  ): ValueRule | void {
    const { actionOption, actionValue } = filterModalRule;
    if (actionOption === undefined) {
      return undefined;
    }

    switch (actionOption) {
      case 'remove_top':
      case 'color_top':
        return actionValue !== undefined && actionValue !== ''
          ? TopRule.create({ n: Number(actionValue) })
          : undefined;

      case 'remove_bottom':
      case 'color_bottom':
        return actionValue !== undefined && actionValue !== ''
          ? BottomRule.create({ n: Number(actionValue) })
          : undefined;

      case 'remove_above':
      case 'color_above':
        return actionValue !== undefined && actionValue !== ''
          ? AboveValueRule.create({ value: Number(actionValue) })
          : undefined;

      case 'remove_below':
      case 'color_below':
        return actionValue !== undefined && actionValue !== ''
          ? BelowValueRule.create({ value: Number(actionValue) })
          : undefined;

      case 'remove_above_average':
      case 'color_above_average':
        return AboveAverageRule.create({});

      case 'remove_below_average':
      case 'color_below_average':
        return BelowAverageRule.create({});

      case 'remove_values_equal_to_zero':
        return EqualToZeroRule.create({});

      case 'remove_values_equal_to_null':
      case 'values_equal_to_null':
        return EqualToNullRule.create({});

      case 'true':
        return IsTrueRule.create({});

      case 'false':
        return IsFalseRule.create({});

      case 'preset_ranges': {
        if (actionValue === undefined || actionValue === '') {
          return undefined;
        }
        const [percentile, n] = actionValue.split(',');
        return InQuantileRule.create({
          percentile: Number(percentile),
          n: Number(n),
        });
      }

      case 'custom_ranges': {
        if (actionValue === undefined || actionValue === '') {
          return undefined;
        }
        const [startValue, endValue] = actionValue.split(',');
        return InValueRangeRule.create({
          startValue: Number(startValue),
          endValue: Number(endValue),
        });
      }

      default:
        throw new Error(`[ValueRuleUtil] ${actionOption} is not yet supported`);
    }
  }
}
