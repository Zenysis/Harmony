// @flow
import * as React from 'react';

/**
 * A "Simple" filter is one that does not require any configuration.
 */
type SimpleFilterRule = {
  +tag: 'ABOVE_AVERAGE' | 'BELOW_AVERAGE' | 'EQUAL_TO_NULL' | 'EQUAL_TO_ZERO',
};

/**
 * A "SingleValue" filter is one that is configurable with a single value.
 * For example, the 'ABOVE_VALUE' rule requires an input value that is
 * used to filter all values above that value.
 */
type SingleValueFilterRule = {
  +tag: 'ABOVE_VALUE' | 'BELOW_VALUE' | 'TOP' | 'BOTTOM',
  +value: number | void,
};

/**
 * A union of the filter rule types allowable in our UI
 */
export type FilterRuleTemplate = SimpleFilterRule | SingleValueFilterRule;

/**
 * A field's filter rule representation in our UI. This is referred to as a
 * 'Template' because it allows incomplete data (e.g. a void fieldId, or void
 * rule). Once all data is fully entered, then we translate it into a ZenModel
 * that can be persisted in our QueryResultSpec.
 */
export type FieldFilterRuleTemplate = {
  +fieldId: string | void,
  +rule: FilterRuleTemplate | void,

  /**
   * This id is used only internally in the UI so we can pass a unique key
   * to React components when this is rendered in an array
   */
  id: React.Key,
};

export type FilterRuleType = $PropertyType<FilterRuleTemplate, 'tag'>;

/**
 * Checks if this rule requires a single-value parameter.
 */
export function isSingleValueFilterRule(
  rule: FilterRuleTemplate,
): boolean %checks {
  return (
    rule.tag === 'ABOVE_VALUE' ||
    rule.tag === 'BELOW_VALUE' ||
    rule.tag === 'BOTTOM' ||
    rule.tag === 'TOP'
  );
}

/**
 * Checks if this rule is a simple filter rule
 */
export function isSimpleFilterRule(rule: FilterRuleTemplate): boolean %checks {
  return (
    rule.tag === 'ABOVE_AVERAGE' ||
    rule.tag === 'BELOW_AVERAGE' ||
    rule.tag === 'EQUAL_TO_NULL' ||
    rule.tag === 'EQUAL_TO_ZERO'
  );
}

/**
 * Create the default rule info for a given `ruleType`
 */
export function createDefaultRule(
  ruleType: FilterRuleType,
): FilterRuleTemplate {
  switch (ruleType) {
    // simple filter rule
    case 'ABOVE_AVERAGE':
    case 'BELOW_AVERAGE':
    case 'EQUAL_TO_NULL':
    case 'EQUAL_TO_ZERO':
      return { tag: ruleType };

    // single-value filter rule
    case 'ABOVE_VALUE':
    case 'BELOW_VALUE':
    case 'TOP':
    case 'BOTTOM':
      return {
        tag: ruleType,
        value: undefined,
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
 * from ABOVE_VALUE to BELOW_VALUE, we will keep the same value instead of
 * resetting the value.
 */
export function castToNewRuleType(
  oldRule: FilterRuleTemplate,
  newRuleType: FilterRuleType,
): FilterRuleTemplate {
  switch (newRuleType) {
    // casting to a simple filter rule
    case 'ABOVE_AVERAGE':
    case 'BELOW_AVERAGE':
    case 'EQUAL_TO_NULL':
    case 'EQUAL_TO_ZERO': {
      if (isSimpleFilterRule(oldRule) || isSingleValueFilterRule(oldRule)) {
        // just change the tag, the value gets lost
        return { tag: newRuleType };
      }

      throw new Error(
        'Did not cover all cases when casting to a SimpleFilterRule.',
      );
    }

    // casting to a single-value filter rule
    case 'ABOVE_VALUE':
    case 'BELOW_VALUE':
    case 'TOP':
    case 'BOTTOM': {
      if (isSimpleFilterRule(oldRule)) {
        return { tag: newRuleType, value: undefined };
      }

      if (isSingleValueFilterRule(oldRule)) {
        // keep the old value
        return {
          tag: newRuleType,
          value: oldRule.value,
        };
      }

      throw new Error(
        'Did not cover all cases when casting to a SingleValueFilterRule.',
      );
    }

    default:
      throw new Error(
        `Invalid rule type passed to castToNewRuleType: ${newRuleType}`,
      );
  }
}
