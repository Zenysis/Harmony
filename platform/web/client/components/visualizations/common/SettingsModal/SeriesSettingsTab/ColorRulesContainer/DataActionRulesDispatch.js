// @flow
import * as React from 'react';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import {
  PRESET_COLOR_ORDER,
  createDefaultRule,
  createQuantileRule,
  castToNewRuleType,
} from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/types';
import { noop, uniqueId, uuid } from 'util/util';
import type {
  ColorRuleType,
  ColorRuleTemplate,
  ColorRuleTemplateHolder,
  QuantileRange,
  QuantileColorRule,
  ValueRange,
} from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/types';

// TODO: Rename ColorRuleTemplate to DataActionRuleTemplate since
// it applies to more than just colors. It also holds data action rule
// information such as text transform.

export type DataRuleDispatchAction =
  /** Replace the color rule at `ruleId` with `newColorRule` */
  | {
      newColorRule: ColorRuleTemplate,
      ruleId: string,
      type: 'DATA_RULE_UPDATE',
    }

  /**
   * Remove the old quantiles and replace them with new ones. This is used when
   * the user switches the number of quantiles to show, so we have to remove all
   * old quantiles and create a new array of default rules to insert.
   */
  | {
      numNewQuantiles: number,
      ruleId: string,
      ruleToChange: QuantileColorRule,
      type: 'QUANTILE_RULES_REPLACE',
    }

  /** Replace the quantile at `rangeIdx` for rule at `ruleId` with `newRange */
  | {
      newRange: QuantileRange,
      rangeIdx: number,
      ruleId: string,
      type: 'QUANTILE_CHANGE',
    }

  /** Replace the range at `rangeIdx` for rule at `ruleId` with `newRange */
  | {
      newRange: ValueRange,
      rangeIdx: number,
      ruleId: string,
      type: 'VALUE_RANGE_CHANGE',
    }

  /** Remove a value range at `rangeIdx` at the given `ruleId` */
  | {
      rangeIdx: number,
      ruleId: string,
      type: 'VALUE_RANGE_REMOVE',
    }
  /** Add a new value range at the given `ruleId */
  | {
      ruleId: string,
      type: 'VALUE_RANGE_ADD',
    }

  /** Delete the rule at `ruleId` */
  | {
      ruleId: string,
      type: 'COLOR_RULE_DELETE',
    }

  /** Push a new empty rule */
  | { series: $ReadOnlyArray<string>, type: 'COLOR_RULE_ADD' }

  /** Change rule type (e.g. from AboveAverage to BelowValue) */
  | {
      newRuleType: ColorRuleType,
      oldRule: ColorRuleTemplate | void,
      ruleId: string,
      type: 'COLOR_RULE_TYPE_CHANGE',
    };

export function dataActionRulesReducer(
  colorRules: Zen.Array<ColorRuleTemplateHolder>,
  action: DataRuleDispatchAction,
): Zen.Array<ColorRuleTemplateHolder> {
  switch (action.type) {
    case 'DATA_RULE_UPDATE': {
      // swap out the old color rule for the new one
      const { newColorRule, ruleId } = action;
      const idx = colorRules.findIndex(rule => rule.id === ruleId);
      const oldRuleHolder = colorRules.get(idx);
      return colorRules.set(idx, {
        id: ruleId,
        rule: newColorRule,
        series: oldRuleHolder.series,
      });
    }

    case 'QUANTILE_RULES_REPLACE': {
      const { ruleId, ruleToChange } = action;
      const oldColors = ruleToChange.ranges.mapValues(r => r.color);
      const { ranges } = createQuantileRule(action.numNewQuantiles);

      // copy over any of the old colors that were already chosen
      const newRanges = ranges.map((r, i) =>
        i < oldColors.length ? { ...r, color: oldColors[i] } : r,
      );

      const idx = colorRules.findIndex(rule => rule.id === ruleId);
      const oldRuleHolder = colorRules.get(idx);

      return colorRules.set(idx, {
        id: ruleId,
        rule: {
          ranges: newRanges,
          tag: 'IN_QUANTILE',
        },
        series: oldRuleHolder.series,
      });
    }

    case 'QUANTILE_CHANGE': {
      const { newRange, rangeIdx, ruleId } = action;
      const idx = colorRules.findIndex(rule => rule.id === ruleId);
      return colorRules.apply(idx, ruleHolder => {
        invariant(
          ruleHolder.rule && ruleHolder.rule.tag === 'IN_QUANTILE',
          'Can only call QUANTILE_CHANGE on a quantile rule.',
        );
        return {
          id: ruleId,
          rule: {
            ...ruleHolder.rule,
            ranges: ruleHolder.rule.ranges.set(rangeIdx, newRange),
          },
          series: ruleHolder.series,
        };
      });
    }

    case 'VALUE_RANGE_CHANGE': {
      const { newRange, rangeIdx, ruleId } = action;
      const idx = colorRules.findIndex(rule => rule.id === ruleId);
      return colorRules.apply(idx, ruleHolder => {
        invariant(
          ruleHolder.rule && ruleHolder.rule.tag === 'IN_VALUE_RANGE',
          'Can only call VALUE_RANGE_CHANGE on a value range rule.',
        );
        return {
          id: ruleId,
          rule: {
            ...ruleHolder.rule,
            ranges: ruleHolder.rule.ranges.set(rangeIdx, newRange),
          },
          series: ruleHolder.series,
        };
      });
    }

    case 'VALUE_RANGE_REMOVE': {
      const idx = colorRules.findIndex(rule => rule.id === action.ruleId);
      return colorRules.apply(idx, ruleHolder => {
        invariant(
          ruleHolder.rule && ruleHolder.rule.tag === 'IN_VALUE_RANGE',
          'Can only call VALUE_RANGE_REMOVE on a quantile rule',
        );
        return {
          id: action.ruleId,
          rule: {
            ...ruleHolder.rule,
            ranges: ruleHolder.rule.ranges.delete(action.rangeIdx),
          },
          series: ruleHolder.series,
        };
      });
    }

    case 'VALUE_RANGE_ADD': {
      const idx = colorRules.findIndex(rule => rule.id === action.ruleId);

      return colorRules.apply(idx, ruleHolder => {
        const { rule } = ruleHolder;
        invariant(
          rule && rule.tag === 'IN_VALUE_RANGE',
          'Can only call VALUE_RANGE_ADD on a quantile rule',
        );
        const numRanges = rule.ranges.size();
        return {
          id: action.ruleId,
          rule: {
            ...rule,
            ranges: rule.ranges.push({
              color: PRESET_COLOR_ORDER[numRanges % PRESET_COLOR_ORDER.length],
              id: uniqueId(),
              label: '',
              max: undefined,
              min: undefined,
              transformedText: undefined,
              type: 'value',
            }),
          },
          series: ruleHolder.series,
        };
      });
    }

    case 'COLOR_RULE_DELETE': {
      const idx = colorRules.findIndex(rule => rule.id === action.ruleId);
      return colorRules.delete(idx);
    }

    case 'COLOR_RULE_ADD':
      return colorRules.push({
        id: uuid(),
        rule: undefined,
        series: new Set(action.series),
      });

    case 'COLOR_RULE_TYPE_CHANGE': {
      const { newRuleType, oldRule, ruleId } = action;
      const idx = colorRules.findIndex(rule => rule.id === ruleId);
      const oldRuleHolder = colorRules.get(idx);
      return colorRules.set(idx, {
        id: ruleId,
        rule: oldRule
          ? castToNewRuleType(oldRule, newRuleType)
          : createDefaultRule(newRuleType),
        series: oldRuleHolder.series,
      });
    }

    default:
      throw new Error(`Invalid action: ${action.type}`);
  }
}

export default (React.createContext(noop): React.Context<
  $Dispatch<DataRuleDispatchAction>,
>);
