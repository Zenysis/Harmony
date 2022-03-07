// @flow
import * as Zen from 'lib/Zen';
import AboveAverageRule from 'models/core/QueryResultSpec/ValueRule/AboveAverageRule';
import AboveValueRule from 'models/core/QueryResultSpec/ValueRule/AboveValueRule';
import BelowAverageRule from 'models/core/QueryResultSpec/ValueRule/BelowAverageRule';
import BelowValueRule from 'models/core/QueryResultSpec/ValueRule/BelowValueRule';
import BottomRule from 'models/core/QueryResultSpec/ValueRule/BottomRule';
import DataFilter from 'models/core/QueryResultSpec/DataFilter';
import DataFilterGroup from 'models/core/QueryResultSpec/DataFilterGroup';
import EqualToNullRule from 'models/core/QueryResultSpec/ValueRule/EqualToNullRule';
import EqualToZeroRule from 'models/core/QueryResultSpec/ValueRule/EqualToZeroRule';
import TopRule from 'models/core/QueryResultSpec/ValueRule/TopRule';
import { isSingleValueFilterRule } from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/FilterModal/types';
import { uniqueId } from 'util/util';
import type { FieldFilterRuleTemplate } from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/FilterModal/types';
import type { ValueRule } from 'models/core/QueryResultSpec/ValueRule/types';

/**
 * Convert a DataFilterGroup model to an array of FieldFilterRuleTemplates that
 * are easier to work with in our UI.
 */
export function dataFilterGroupToFilterRuleTemplates(
  dataFilterGroup: DataFilterGroup,
): Zen.Array<FieldFilterRuleTemplate> {
  const filterRuleTemplates = [];
  dataFilterGroup.filters().forEach(({ fieldId, filter }) => {
    const id = uniqueId();
    const rule = filter.rule();
    switch (rule.tag) {
      case 'ABOVE_AVERAGE':
      case 'BELOW_AVERAGE':
      case 'EQUAL_TO_NULL':
      case 'EQUAL_TO_ZERO':
        filterRuleTemplates.push({ id, fieldId, rule: { tag: rule.tag } });
        return;
      case 'ABOVE_VALUE':
      case 'BELOW_VALUE':
        filterRuleTemplates.push({
          id,
          fieldId,
          rule: { tag: rule.tag, value: rule.get('value') },
        });
        return;
      case 'TOP':
      case 'BOTTOM':
        filterRuleTemplates.push({
          id,
          fieldId,
          rule: { tag: rule.tag, value: rule.get('n') },
        });
        return;
      default:
        throw new Error(
          `Invalid rule type received in ColorRulesContainer: ${rule.tag}`,
        );
    }
  });
  return Zen.Array.create(filterRuleTemplates);
}

function _makeDataFilter(
  fieldId: string,
  rule: ValueRule,
): { +fieldId: string, +filter: DataFilter } {
  return { fieldId, filter: DataFilter.create({ rule, operation: 'REMOVE' }) };
}

/**
 * Convert a ZenArray of FieldFilterRuleTemplates to DataFilter models that can
 * be stored by our QueryResultSpec. This translation is necessary because
 * FieldFilterRuleTemplates are easier to work with in our UI (i.e. they allow
 * some values to be void), but are harder to work with in the rest of our
 * platform.
 */
export function filterRuleTemplatesToDataFilterGroup(
  filterTemplates: Zen.Array<FieldFilterRuleTemplate>,
): DataFilterGroup {
  const filters = filterTemplates.map(filter => {
    const { fieldId, rule } = filter;
    if (fieldId !== undefined && rule !== undefined) {
      switch (rule.tag) {
        case 'ABOVE_AVERAGE':
          return _makeDataFilter(fieldId, AboveAverageRule.create({}));
        case 'BELOW_AVERAGE':
          return _makeDataFilter(fieldId, BelowAverageRule.create({}));
        case 'EQUAL_TO_ZERO':
          return _makeDataFilter(fieldId, EqualToZeroRule.create({}));
        case 'EQUAL_TO_NULL':
          return _makeDataFilter(fieldId, EqualToNullRule.create({}));
        case 'ABOVE_VALUE':
          return rule.value === undefined
            ? undefined
            : _makeDataFilter(
                fieldId,
                AboveValueRule.create({ value: rule.value }),
              );
        case 'BELOW_VALUE':
          return rule.value === undefined
            ? undefined
            : _makeDataFilter(
                fieldId,
                BelowValueRule.create({ value: rule.value }),
              );
        case 'TOP':
          return rule.value === undefined
            ? undefined
            : _makeDataFilter(fieldId, TopRule.create({ n: rule.value }));
        case 'BOTTOM':
          return rule.value === undefined
            ? undefined
            : _makeDataFilter(fieldId, BottomRule.create({ n: rule.value }));
        default:
          throw new Error(`Invalid rule tag: ${rule.tag}`);
      }
    }
    return undefined;
  });

  return DataFilterGroup.create({ filters: filters.filter(Boolean) });
}

/**
 * Given an array of filter rules, count how many rules have not been fully
 * created yet.
 */
export function countIncompleteRules(
  filterTemplates: Zen.Array<FieldFilterRuleTemplate>,
): number {
  let count = 0;
  filterTemplates.forEach(({ fieldId, rule }) => {
    if (fieldId === undefined || rule === undefined) {
      count += 1;
      return;
    }

    if (isSingleValueFilterRule(rule)) {
      if (rule.value === undefined) {
        count += 1;
      }
    }
  });
  return count;
}
