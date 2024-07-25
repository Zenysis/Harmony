// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Colors from 'components/ui/Colors';
import { PRIMARY_COLORS } from 'components/QueryResult/graphUtil';
import { range } from 'util/arrayUtil';
import { uniqueId } from 'util/util';

export const PRESET_COLOR_ORDER: Array<string> = [
  Colors.SUCCESS,
  Colors.SUCCESS_HOVER,
  Colors.WARNING,
  Colors.ERROR_HOVER,
  Colors.ERROR,
  PRIMARY_COLORS.ZA_LIGHT_BLUE,
  PRIMARY_COLORS.CYAN,
  PRIMARY_COLORS.BLUE,
  PRIMARY_COLORS.VIOLET,
  PRIMARY_COLORS.MAGENTA,
];

/**
 * Represents the n-th percentile (e.g. "3rd quartile") in a QuantileColorRule
 */
export type QuantileRange = {
  +color: string,
  +label: string,
  +n: number,
  +percentile: number,
  +transformedText: string | void,
  +type: 'quantile',
};

/**
 * Represents a custom value range for a ValueRangeColorRule
 */
export type ValueRange = {
  +color: string,

  /**
   * This id is used only internally in the UI so we can pass a unique key
   * to React components when this is rendered in an array
   */
  +id: React.Key,

  +label: string,
  +max: number | void,
  +min: number | void,
  +transformedText: string | void,
  +type: 'value',
};

/**
 * A "Simple" color rule is one that does not require any configuration
 * other than the color we will apply.
 */
export type SimpleColorRule = {
  +color: string,
  +label: string,
  +tag:
    | 'ABOVE_AVERAGE'
    | 'BELOW_AVERAGE'
    | 'EQUAL_TO_NULL'
    | 'NOT_A_NUMBER'
    | 'IS_FALSE'
    | 'IS_TRUE',
  +transformedText: string | void,
};

/**
 * A "SingleValue" color rule is one that is configurable with a single value.
 * For example, the 'ABOVE_VALUE' rule requires an input value that is
 * used to filter all values above that value.
 */
export type SingleValueColorRule = {
  +color: string,
  +label: string,
  +tag: 'ABOVE_VALUE' | 'BELOW_VALUE' | 'EQUAL_TO_VALUE' | 'TOP' | 'BOTTOM',
  +transformedText: string | void,
  +value: number | void,
};

/**
 * An array of QuantileRanges. Each QuantileRange applies a separate color to
 * any value that falls in that quantile.
 */
export type QuantileColorRule = {
  ranges: Zen.Array<QuantileRange>,
  +tag: 'IN_QUANTILE',
};

/**
 * An array of ValueRanges. Each ValueRange applies a separate color to
 * any value that falls in that range.
 */
export type ValueRangeColorRule = {
  ranges: Zen.Array<ValueRange>,
  +tag: 'IN_VALUE_RANGE',
};

/**
 * A color rule representation in our UI. This is referred to as a 'Template'
 * because it supports incomplete data (e.g. a void fieldId, or void rule).
 * Once all data is fully entered, then we translate it into a ZenModel
 * that can be persisted in our QueryResultSpec.
 */
export type ColorRuleTemplate =
  | SimpleColorRule
  | SingleValueColorRule
  | QuantileColorRule
  | ValueRangeColorRule;

export type ColorRuleType = $PropertyType<ColorRuleTemplate, 'tag'>;

/**
 * This type holds a color rule template and the associated series that it is
 * applied to.' Its the representation of DataActionRule model on the UI
 * and it supports incomplete data i.e a void rule.
 * Once the rule is fully created, then we translate it into a DataActionRule
 * ZenModel
 */
export type ColorRuleTemplateHolder = {
  id: string,
  // A rule can be undefined when starting to create a new rule
  // from the UI
  rule: ColorRuleTemplate | void,

  series: Set<string>,
};

/**
 * Checks if this rule is a ranged rule
 */
export function isRangedColorRule(rule: ColorRuleTemplate): boolean %checks {
  return rule.tag === 'IN_QUANTILE' || rule.tag === 'IN_VALUE_RANGE';
}

/**
 * Checks if this rule is QuantileColorRule
 */
export function isQuantileColorRule(rule: ColorRuleTemplate): boolean %checks {
  return rule.tag === 'IN_QUANTILE';
}

/**
 * Checks if this rule is ValueRangeColorRule
 */
export function isValueRangeColorRule(
  rule: ColorRuleTemplate,
): boolean %checks {
  return rule.tag === 'IN_VALUE_RANGE';
}

/**
 * Checks if this rule requires a single-value parameter.
 */
export function isSingleValueColorRule(
  rule: ColorRuleTemplate,
): boolean %checks {
  return (
    rule.tag === 'ABOVE_VALUE' ||
    rule.tag === 'BELOW_VALUE' ||
    rule.tag === 'EQUAL_TO_VALUE' ||
    rule.tag === 'BOTTOM' ||
    rule.tag === 'TOP'
  );
}

/**
 * Checks if this rule is a simple color rule (i.e. one that does not require
 * any extra parameters beyond just the color we're applying).
 */
export function isSimpleColorRule(rule: ColorRuleTemplate): boolean %checks {
  return (
    rule.tag === 'ABOVE_AVERAGE' ||
    rule.tag === 'BELOW_AVERAGE' ||
    rule.tag === 'EQUAL_TO_NULL' ||
    rule.tag === 'NOT_A_NUMBER' ||
    rule.tag === 'IS_FALSE' ||
    rule.tag === 'IS_TRUE'
  );
}

/**
 * Create a quantile rule representing a given number of quantiles.
 * E.g. if `numQuantiles` is 4, then this creates a rule for quartiles.
 */
export function createQuantileRule(numQuantiles: number): QuantileColorRule {
  const ranges = range(numQuantiles).map(i => ({
    color: PRESET_COLOR_ORDER[i],
    label: '',
    n: i + 1,
    percentile: 1 / numQuantiles,
    transformedText: undefined,
    type: 'quantile',
  }));
  return {
    ranges: Zen.Array.create(ranges),
    tag: 'IN_QUANTILE',
  };
}

/**
 * Create the default rule info for a given `ruleType`
 */
export function createDefaultRule(ruleType: ColorRuleType): ColorRuleTemplate {
  switch (ruleType) {
    // simple color rule
    case 'ABOVE_AVERAGE':
    case 'BELOW_AVERAGE':
    case 'EQUAL_TO_NULL':
    case 'NOT_A_NUMBER':
    case 'IS_FALSE':
    case 'IS_TRUE':
      return {
        color: PRESET_COLOR_ORDER[0],
        label: '',
        tag: ruleType,
        transformedText: undefined,
      };

    // single-value color rule
    case 'ABOVE_VALUE':
    case 'BELOW_VALUE':
    case 'EQUAL_TO_VALUE':
    case 'TOP':
    case 'BOTTOM':
      return {
        color: PRESET_COLOR_ORDER[0],
        label: '',
        tag: ruleType,
        transformedText: undefined,
        value: undefined,
      };

    // quantile rule
    case 'IN_QUANTILE':
      return createQuantileRule(2);

    // value range rule
    case 'IN_VALUE_RANGE':
      return {
        ranges: Zen.Array.create([
          {
            color: PRESET_COLOR_ORDER[0],
            id: uniqueId(),
            label: '',
            max: undefined,
            min: undefined,
            transformedText: undefined,
            type: 'value',
          },
        ]),
        tag: 'IN_VALUE_RANGE',
      };

    default:
      throw new Error(
        `Invalid rule type passed to createDefaultRule: ${ruleType}`,
      );
  }
}

/**
 * Cast a given `rule` to a new type `newRuleType`. When casting we try to keep
 * as much information as possible from the old rule. For example, if we cast
 * from ABOVE_AVERAGE to BELOW_AVERAGE, we will keep the same color instead
 * of resetting the color.
 */
export function castToNewRuleType(
  oldRule: ColorRuleTemplate,
  newRuleType: ColorRuleType,
): ColorRuleTemplate {
  switch (newRuleType) {
    // casting to a simple color rule
    case 'ABOVE_AVERAGE':
    case 'BELOW_AVERAGE':
    case 'EQUAL_TO_NULL':
    case 'NOT_A_NUMBER':
    case 'IS_FALSE':
    case 'IS_TRUE': {
      if (isSimpleColorRule(oldRule) || isSingleValueColorRule(oldRule)) {
        // just change the tag, but we can keep the same old color and label
        return {
          color: oldRule.color,
          label: oldRule.label,
          tag: newRuleType,
          transformedText: undefined,
        };
      }
      if (isRangedColorRule(oldRule)) {
        return {
          color: oldRule.ranges.get(0).color, // take the first color
          label: '',
          tag: newRuleType,
          transformedText: undefined,
        };
      }
      throw new Error(
        'Did not cover all cases when casting to a SimpleColorRule.',
      );
    }

    // casting to a single-value color rule
    case 'ABOVE_VALUE':
    case 'BELOW_VALUE':
    case 'EQUAL_TO_VALUE':
    case 'TOP':
    case 'BOTTOM': {
      if (isSimpleColorRule(oldRule)) {
        return {
          color: oldRule.color,
          label: oldRule.label,
          tag: newRuleType,
          transformedText: oldRule.transformedText,
          value: undefined,
        };
      }

      if (isSingleValueColorRule(oldRule)) {
        // keep all the old values, just change the tag
        return { ...oldRule, tag: newRuleType };
      }

      if (isRangedColorRule(oldRule)) {
        // take the first color of the ranges we have to use for our new rule
        const firstColor = oldRule.ranges.get(0).color;
        return {
          color: firstColor,
          label: '',
          tag: newRuleType,
          transformedText: oldRule.ranges.get(0).transformedText,
          value: undefined,
        };
      }

      throw new Error(
        'Did not cover all cases when casting to a SingleValueColorRule.',
      );
    }

    // casting to a quantile rule
    case 'IN_QUANTILE': {
      const defaultQuantileRule = createQuantileRule(2);
      if (isSimpleColorRule(oldRule) || isSingleValueColorRule(oldRule)) {
        // set the first color to be equal to the oldRule's color
        const newRanges = defaultQuantileRule.ranges.apply(0, r => ({
          ...r,
          color: oldRule.color,
          transformedText: oldRule.transformedText,
        }));

        return {
          ranges: newRanges,
          tag: 'IN_QUANTILE',
        };
      }

      if (isValueRangeColorRule(oldRule)) {
        const newRanges = defaultQuantileRule.ranges.map((r, i) =>
          i <= oldRule.ranges.size() - 1
            ? { ...r, color: oldRule.ranges.get(i).color }
            : r,
        );
        return {
          ranges: newRanges,
          tag: 'IN_QUANTILE',
        };
      }

      if (isQuantileColorRule(oldRule)) {
        return oldRule;
      }

      throw new Error(
        'Did not cover all cases when casting to QuantileColorRule',
      );
    }

    case 'IN_VALUE_RANGE': {
      const defaultRange = {
        color: PRESET_COLOR_ORDER[0],
        id: uniqueId(),
        label: '',
        max: undefined,
        min: undefined,
        type: 'value',
      };

      if (isSimpleColorRule(oldRule) || isSingleValueColorRule(oldRule)) {
        return {
          ranges: Zen.Array.create([
            {
              ...defaultRange,
              color: oldRule.color,
              transformedText: oldRule.transformedText,
            },
          ]),
          tag: 'IN_VALUE_RANGE',
        };
      }

      if (isQuantileColorRule(oldRule)) {
        return {
          ranges: Zen.Array.create([
            {
              ...defaultRange,
              color: oldRule.ranges.get(0).color,
              transformedText: oldRule.ranges.get(0).transformedText,
            },
          ]),
          tag: 'IN_VALUE_RANGE',
        };
      }

      if (isValueRangeColorRule(oldRule)) {
        return oldRule;
      }
      throw new Error('Did not cover all cases when casting to ValueRangeRule');
    }

    default:
      throw new Error(
        `Invalid rule type passed to castToNewRuleType: ${newRuleType}`,
      );
  }
}
