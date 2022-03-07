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

// TODO(solo): Rename ColorRuleTemplate to DataActionRuleTemplate since
// it applies to more than just colors. It also holds data action rule
// information such as text transform.

export type DataRuleDispatchAction =
  /** Replace the color rule at `ruleId` with `newColorRule` */
  | {
      type: 'DATA_RULE_UPDATE',
      ruleId: string,
      newColorRule: ColorRuleTemplate,
    }

  /**
   * Remove the old quantiles and replace them with new ones. This is used when
   * the user switches the number of quantiles to show, so we have to remove all
   * old quantiles and create a new array of default rules to insert.
   */
  | {
      type: 'QUANTILE_RULES_REPLACE',
      numNewQuantiles: number,
      ruleToChange: QuantileColorRule,
      ruleId: string,
    }

  /** Replace the quantile at `rangeIdx` for rule at `ruleId` with `newRange */
  | {
      type: 'QUANTILE_CHANGE',
      ruleId: string,
      rangeIdx: number,
      newRange: QuantileRange,
    }

  /** Replace the range at `rangeIdx` for rule at `ruleId` with `newRange */
  | {
      type: 'VALUE_RANGE_CHANGE',
      ruleId: string,
      rangeIdx: number,
      newRange: ValueRange,
    }

  /** Remove a value range at `rangeIdx` at the given `ruleId` */
  | {
      type: 'VALUE_RANGE_REMOVE',
      ruleId: string,
      rangeIdx: number,
    }
  /** Add a new value range at the given `ruleId */
  | {
      type: 'VALUE_RANGE_ADD',
      ruleId: string,
    }

  /** Delete the rule at `ruleId` */
  | {
      type: 'COLOR_RULE_DELETE',
      ruleId: string,
    }

  /** Push a new empty rule */
  | { type: 'COLOR_RULE_ADD', series: $ReadOnlyArray<string> }

  /** Change rule type (e.g. from AboveAverage to BelowValue) */
  | {
      type: 'COLOR_RULE_TYPE_CHANGE',
      ruleId: string,
      oldRule: ColorRuleTemplate | void,
      newRuleType: ColorRuleType,
    };

export function dataActionRulesReducer(
  colorRules: Zen.Array<ColorRuleTemplateHolder>,
  action: DataRuleDispatchAction,
): Zen.Array<ColorRuleTemplateHolder> {
  switch (action.type) {
    case 'DATA_RULE_UPDATE': {
      // swap out the old color rule for the new one
      const { ruleId, newColorRule } = action;
      const idx = colorRules.findIndex(rule => rule.id === ruleId);
      const oldRuleHolder = colorRules.get(idx);
      return colorRules.set(idx, {
        id: ruleId,
        rule: newColorRule,
        series: oldRuleHolder.series,
      });
    }

    case 'QUANTILE_RULES_REPLACE': {
      const { ruleToChange, ruleId } = action;
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
        series: oldRuleHolder.series,
        rule: {
          tag: 'IN_QUANTILE',
          ranges: newRanges,
        },
      });
    }

    case 'QUANTILE_CHANGE': {
      const { rangeIdx, ruleId, newRange } = action;
      const idx = colorRules.findIndex(rule => rule.id === ruleId);
      return colorRules.apply(idx, ruleHolder => {
        invariant(
          ruleHolder.rule && ruleHolder.rule.tag === 'IN_QUANTILE',
          'Can only call QUANTILE_CHANGE on a quantile rule.',
        );
        return {
          id: ruleId,
          series: ruleHolder.series,
          rule: {
            ...ruleHolder.rule,
            ranges: ruleHolder.rule.ranges.set(rangeIdx, newRange),
          },
        };
      });
    }

    case 'VALUE_RANGE_CHANGE': {
      const { rangeIdx, ruleId, newRange } = action;
      const idx = colorRules.findIndex(rule => rule.id === ruleId);
      return colorRules.apply(idx, ruleHolder => {
        invariant(
          ruleHolder.rule && ruleHolder.rule.tag === 'IN_VALUE_RANGE',
          'Can only call VALUE_RANGE_CHANGE on a value range rule.',
        );
        return {
          id: ruleId,
          series: ruleHolder.series,
          rule: {
            ...ruleHolder.rule,
            ranges: ruleHolder.rule.ranges.set(rangeIdx, newRange),
          },
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
          series: ruleHolder.series,
          rule: {
            ...ruleHolder.rule,
            ranges: ruleHolder.rule.ranges.delete(action.rangeIdx),
          },
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
          series: ruleHolder.series,
          rule: {
            ...rule,
            ranges: rule.ranges.push({
              id: uniqueId(),
              type: 'value',
              label: '',
              min: undefined,
              max: undefined,
              color: PRESET_COLOR_ORDER[numRanges % PRESET_COLOR_ORDER.length],
              transformedText: undefined,
            }),
          },
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
        series: new Set(action.series),
        rule: undefined,
      });

    case 'COLOR_RULE_TYPE_CHANGE': {
      const { ruleId, oldRule, newRuleType } = action;
      const idx = colorRules.findIndex(rule => rule.id === ruleId);
      const oldRuleHolder = colorRules.get(idx);
      return colorRules.set(idx, {
        id: ruleId,
        series: oldRuleHolder.series,
        rule: oldRule
          ? castToNewRuleType(oldRule, newRuleType)
          : createDefaultRule(newRuleType),
      });
    }

    default:
      throw new Error(`Invalid action: ${action.type}`);
  }
}

export default (React.createContext(noop): React.Context<
  $Dispatch<DataRuleDispatchAction>,
>);
