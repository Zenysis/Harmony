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
  +type: 'quantile',
  +color: string,
  +label: string,
  +n: number,
  +percentile: number,
  +transformedText: string | void,
};

/**
 * Represents a custom value range for a ValueRangeColorRule
 */
export type ValueRange = {
  +type: 'value',
  +color: string,
  +label: string,
  +min: number | void,
  +max: number | void,
  +transformedText: string | void,

  /**
   * This id is used only internally in the UI so we can pass a unique key
   * to React components when this is rendered in an array
   */
  +id: React.Key,
};

/**
 * A "Simple" color rule is one that does not require any configuration
 * other than the color we will apply.
 */
export type SimpleColorRule = {
  +tag:
    | 'ABOVE_AVERAGE'
    | 'BELOW_AVERAGE'
    | 'EQUAL_TO_NULL'
    | 'IS_FALSE'
    | 'IS_TRUE',
  +color: string,
  +label: string,
  +transformedText: string | void,
};

/**
 * A "SingleValue" color rule is one that is configurable with a single value.
 * For example, the 'ABOVE_VALUE' rule requires an input value that is
 * used to filter all values above that value.
 */
export type SingleValueColorRule = {
  +tag: 'ABOVE_VALUE' | 'BELOW_VALUE' | 'TOP' | 'BOTTOM',
  +value: number | void,
  +color: string,
  +label: string,
  +transformedText: string | void,
};

/**
 * An array of QuantileRanges. Each QuantileRange applies a separate color to
 * any value that falls in that quantile.
 */
export type QuantileColorRule = {
  +tag: 'IN_QUANTILE',
  ranges: Zen.Array<QuantileRange>,
};

/**
 * An array of ValueRanges. Each ValueRange applies a separate color to
 * any value that falls in that range.
 */
export type ValueRangeColorRule = {
  +tag: 'IN_VALUE_RANGE',
  ranges: Zen.Array<ValueRange>,
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
  series: Set<string>,

  // A rule can be undefined when starting to create a new rule
  // from the UI
  rule: ColorRuleTemplate | void,
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
    type: 'quantile',
    color: PRESET_COLOR_ORDER[i],
    label: '',
    transformedText: undefined,
    n: i + 1,
    percentile: 1 / numQuantiles,
  }));
  return {
    tag: 'IN_QUANTILE',
    ranges: Zen.Array.create(ranges),
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
    case 'IS_FALSE':
    case 'IS_TRUE':
      return {
        tag: ruleType,
        color: PRESET_COLOR_ORDER[0],
        label: '',
        transformedText: undefined,
      };

    // single-value color rule
    case 'ABOVE_VALUE':
    case 'BELOW_VALUE':
    case 'TOP':
    case 'BOTTOM':
      return {
        tag: ruleType,
        color: PRESET_COLOR_ORDER[0],
        value: undefined,
        label: '',
        transformedText: undefined,
      };

    // quantile rule
    case 'IN_QUANTILE':
      return createQuantileRule(2);

    // value range rule
    case 'IN_VALUE_RANGE':
      return {
        tag: 'IN_VALUE_RANGE',
        ranges: Zen.Array.create([
          {
            type: 'value',
            color: PRESET_COLOR_ORDER[0],
            label: '',
            min: undefined,
            max: undefined,
            id: uniqueId(),
            transformedText: undefined,
          },
        ]),
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
    case 'IS_FALSE':
    case 'IS_TRUE': {
      if (isSimpleColorRule(oldRule) || isSingleValueColorRule(oldRule)) {
        // just change the tag, but we can keep the same old color and label
        return {
          tag: newRuleType,
          color: oldRule.color,
          label: oldRule.label,
          transformedText: undefined,
        };
      }
      if (isRangedColorRule(oldRule)) {
        return {
          tag: newRuleType,
          color: oldRule.ranges.get(0).color, // take the first color
          label: '',
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
    case 'TOP':
    case 'BOTTOM': {
      if (isSimpleColorRule(oldRule)) {
        return {
          tag: newRuleType,
          color: oldRule.color,
          value: undefined,
          label: oldRule.label,
          transformedText: oldRule.transformedText,
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
          tag: newRuleType,
          color: firstColor,
          value: undefined,
          label: '',
          transformedText: oldRule.ranges.get(0).transformedText,
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
          tag: 'IN_QUANTILE',
          ranges: newRanges,
        };
      }

      if (isValueRangeColorRule(oldRule)) {
        const newRanges = defaultQuantileRule.ranges.map((r, i) =>
          i <= oldRule.ranges.size() - 1
            ? { ...r, color: oldRule.ranges.get(i).color }
            : r,
        );
        return {
          tag: 'IN_QUANTILE',
          ranges: newRanges,
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
        type: 'value',
        color: PRESET_COLOR_ORDER[0],
        label: '',
        min: undefined,
        max: undefined,
        id: uniqueId(),
      };

      if (isSimpleColorRule(oldRule) || isSingleValueColorRule(oldRule)) {
        return {
          tag: 'IN_VALUE_RANGE',
          ranges: Zen.Array.create([
            {
              ...defaultRange,
              color: oldRule.color,
              transformedText: oldRule.transformedText,
            },
          ]),
        };
      }

      if (isQuantileColorRule(oldRule)) {
        return {
          tag: 'IN_VALUE_RANGE',
          ranges: Zen.Array.create([
            {
              ...defaultRange,
              color: oldRule.ranges.get(0).color,
              transformedText: oldRule.ranges.get(0).transformedText,
            },
          ]),
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
