// @flow
import * as Zen from 'lib/Zen';
import AboveAverageRule from 'models/core/QueryResultSpec/ValueRule/AboveAverageRule';
import AboveValueRule from 'models/core/QueryResultSpec/ValueRule/AboveValueRule';
import BelowAverageRule from 'models/core/QueryResultSpec/ValueRule/BelowAverageRule';
import BelowValueRule from 'models/core/QueryResultSpec/ValueRule/BelowValueRule';
import BottomRule from 'models/core/QueryResultSpec/ValueRule/BottomRule';
import DataAction from 'models/core/QueryResultSpec/DataAction';
import DataActionRule from 'models/core/QueryResultSpec/DataActionRule';
import EqualToNullRule from 'models/core/QueryResultSpec/ValueRule/EqualToNullRule';
import EqualToValueRule from 'models/core/QueryResultSpec/ValueRule/EqualToValueRule';
import InQuantileRule from 'models/core/QueryResultSpec/ValueRule/InQuantileRule';
import InValueRangeRule from 'models/core/QueryResultSpec/ValueRule/InValueRangeRule';
import IsFalseRule from 'models/core/QueryResultSpec/ValueRule/IsFalseRule';
import IsTrueRule from 'models/core/QueryResultSpec/ValueRule/IsTrueRule';
import NotANumberRule from 'models/core/QueryResultSpec/ValueRule/NotANumberRule';
import TopRule from 'models/core/QueryResultSpec/ValueRule/TopRule';
import { uniqueId } from 'util/util';
import type {
  ColorRuleTemplate,
  ColorRuleTemplateHolder,
} from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/types';
import type { ValueRule } from 'models/core/QueryResultSpec/ValueRule/types';

/**
 * Convert an array of data model to an array of ColorRuleTemplates that are
 * easier to work with in our UI.
 */
function dataActionsToColorRuleTemplates(
  dataActions: $ReadOnlyArray<DataAction>,
): Zen.Array<ColorRuleTemplate> {
  // the QueryResultSpec stores each range rule as separate rules (e.g. coloring
  // quartiles are stored as 4 separate rules, one for each quartile).
  // So to render things correctly we have to group together the ranged rules
  // that should be rendered together
  const modalRules = [];
  dataActions.forEach((action, i) => {
    const color = action.color();
    const rule = action.rule();
    const label = action.label();
    const transformedText = action.transformedText();
    switch (rule.tag) {
      case 'ABOVE_AVERAGE':
      case 'BELOW_AVERAGE':
      case 'EQUAL_TO_NULL':
      case 'NOT_A_NUMBER':
      case 'IS_FALSE':
      case 'IS_TRUE':
        modalRules.push({ color, label, transformedText, tag: rule.tag });
        return;
      case 'ABOVE_VALUE':
      case 'EQUAL_TO_VALUE':
      case 'BELOW_VALUE':
        modalRules.push({
          color,
          label,
          transformedText,
          tag: rule.tag,
          value: rule.get('value'),
        });
        return;
      case 'TOP':
      case 'BOTTOM':
        modalRules.push({
          color,
          label,
          transformedText,
          tag: rule.tag,
          value: rule.get('n'),
        });
        return;
      case 'IN_QUANTILE': {
        const percentile = rule.percentile();
        const newQuantile = {
          color,
          label,
          percentile,
          transformedText,
          n: rule.n(),
          type: 'quantile',
        };
        const newModalRule = {
          ranges: Zen.Array.create([newQuantile]),
          tag: 'IN_QUANTILE',
        };

        if (i === 0) {
          modalRules.push(newModalRule);
          return;
        }

        const lastModalRule = modalRules[modalRules.length - 1];
        if (
          lastModalRule.tag === 'IN_QUANTILE' &&
          percentile === lastModalRule.ranges.first().percentile
        ) {
          lastModalRule.ranges = lastModalRule.ranges.push(newQuantile);
          return;
        }

        modalRules.push(newModalRule);
        return;
      }
      case 'IN_VALUE_RANGE': {
        const newRange = {
          color,
          label,
          transformedText,
          id: uniqueId(),
          max: rule.endValue(),
          min: rule.startValue(),
          type: 'value',
        };
        const newModalRule = {
          ranges: Zen.Array.create([newRange]),
          tag: 'IN_VALUE_RANGE',
        };

        if (i === 0) {
          modalRules.push(newModalRule);
          return;
        }

        const lastModalRule = modalRules[modalRules.length - 1];
        if (lastModalRule.tag === 'IN_VALUE_RANGE') {
          lastModalRule.ranges = lastModalRule.ranges.push(newRange);
          return;
        }

        modalRules.push(newModalRule);
        return;
      }
      default:
        throw new Error(
          `Invalid rule type received in ColorRulesContainer: ${rule.tag}`,
        );
    }
  });
  return Zen.Array.create(modalRules);
}

function _makeDataAction(
  color: string,
  rule: ValueRule,
  label: string,
  transformedText: string | void,
): DataAction {
  return DataAction.create({ color, label, rule, transformedText });
}

/**
 * Convert a ColorRuleTemplate to DataActions that can be stored by
 * our QueryResultSpec. This translation is necessary because a ColorRuleTemplate
 * are easier to work with in our UI (i.e. they allow some values to be void),
 * but are harder to work with in the rest of our platform.
 */
function colorRuleTemplateToDataActions(
  rule: ColorRuleTemplate | void,
): $ReadOnlyArray<DataAction> {
  if (rule === undefined) {
    return [];
  }

  switch (rule.tag) {
    case 'ABOVE_AVERAGE':
      return [
        _makeDataAction(
          rule.color,
          AboveAverageRule.create({}),
          rule.label,
          rule.transformedText,
        ),
      ];
    case 'BELOW_AVERAGE':
      return [
        _makeDataAction(
          rule.color,
          BelowAverageRule.create({}),
          rule.label,
          rule.transformedText,
        ),
      ];
    case 'EQUAL_TO_NULL':
      return [
        _makeDataAction(
          rule.color,
          EqualToNullRule.create({}),
          rule.label,
          rule.transformedText,
        ),
      ];
    case 'NOT_A_NUMBER':
      return [
        _makeDataAction(
          rule.color,
          NotANumberRule.create({}),
          rule.label,
          rule.transformedText,
        ),
      ];
    case 'IS_FALSE':
      return [
        _makeDataAction(
          rule.color,
          IsFalseRule.create({}),
          rule.label,
          rule.transformedText,
        ),
      ];
    case 'IS_TRUE':
      return [
        _makeDataAction(
          rule.color,
          IsTrueRule.create({}),
          rule.label,
          rule.transformedText,
        ),
      ];
    case 'ABOVE_VALUE':
      return rule.value === undefined
        ? []
        : [
            _makeDataAction(
              rule.color,
              AboveValueRule.create({ value: rule.value }),
              rule.label,
              rule.transformedText,
            ),
          ];
    case 'EQUAL_TO_VALUE':
      return rule.value === undefined
        ? []
        : [
            _makeDataAction(
              rule.color,
              EqualToValueRule.create({ value: rule.value }),
              rule.label,
              rule.transformedText,
            ),
          ];
    case 'BELOW_VALUE':
      return rule.value === undefined
        ? []
        : [
            _makeDataAction(
              rule.color,
              BelowValueRule.create({ value: rule.value }),
              rule.label,
              rule.transformedText,
            ),
          ];
    case 'TOP':
      return rule.value === undefined
        ? []
        : [
            _makeDataAction(
              rule.color,
              TopRule.create({ n: rule.value }),
              rule.label,
              rule.transformedText,
            ),
          ];
    case 'BOTTOM':
      return rule.value === undefined
        ? []
        : [
            _makeDataAction(
              rule.color,
              BottomRule.create({ n: rule.value }),
              rule.label,
              rule.transformedText,
            ),
          ];

    case 'IN_QUANTILE':
      return rule.ranges
        .map(range =>
          _makeDataAction(
            range.color,
            InQuantileRule.create({
              n: range.n,
              percentile: range.percentile,
            }),
            range.label,
            range.transformedText,
          ),
        )
        .toArray();

    case 'IN_VALUE_RANGE':
      return rule.ranges
        .map(range =>
          range.min !== undefined && range.max !== undefined
            ? _makeDataAction(
                range.color,
                InValueRangeRule.create({
                  endValue: range.max,
                  startValue: range.min,
                }),
                range.label,
                range.transformedText,
              )
            : undefined,
        )
        .toArray()
        .filter(Boolean);
    default:
      throw new Error(`Invalid rule tag: ${rule.tag}`);
  }
}

/**
 * Convert a DataActionRule into ColorRuleTemplateHolder that are
 * easier to work with in our UI.
 */
export function dataActionRulesToColorRuleTemplateHolder(
  dataActionRules: Zen.Array<DataActionRule>,
): Zen.Array<ColorRuleTemplateHolder> {
  return dataActionRules.map(actionRule => {
    const id = actionRule.id();
    const series = actionRule.series();
    const actions = actionRule.dataActions();
    // NOTE: Since all actions passed to dataActionsToColorRuleTemplates
    // belong to a single rule, they will combined into a single rule
    // thus modelRules will only contain one value
    const modelRules = dataActionsToColorRuleTemplates(actions);
    return {
      id,
      series,
      rule: modelRules.get(0),
    };
  });
}

/**
 * Convert an array of ColorRuleTemplateHolder into DataActionRule array
 that we store in the QueryResultSpec
 */
export function colorRuleTemplateHoldersToDataActionRules(
  rules: Zen.Array<ColorRuleTemplateHolder>,
): Zen.Array<DataActionRule> {
  const actionRules = rules.map(template => {
    const { id, rule, series } = template;
    const dataActions = colorRuleTemplateToDataActions(rule);

    if (dataActions.length === 0) {
      return undefined;
    }

    return DataActionRule.create({
      dataActions,
      id,
      series,
    });
  });

  // filter out undefined rules
  return actionRules.filter(Boolean);
}
