// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import {
  castToNewRuleType,
  createDefaultRule,
} from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/FilterModal/types';
import { dataFilterGroupToFilterRuleTemplates } from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/FilterModal/util';
import { noop, uniqueId } from 'util/util';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type {
  FieldFilterRuleTemplate,
  FilterRuleTemplate,
  FilterRuleType,
} from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/FilterModal/types';

export function initializeRuleTemplates(
  queryResultSpec: QueryResultSpec,
): Zen.Array<FieldFilterRuleTemplate> {
  return dataFilterGroupToFilterRuleTemplates(queryResultSpec.dataFilters());
}

export type FilterRuleAction =
  /** Replace the filter rule at `ruleIdx` with `newFilterRule` */
  | {
      type: 'FILTER_RULE_UPDATE',
      ruleIdx: number,
      newFilterRule: FilterRuleTemplate,
    }

  /** Add a new filter rule */
  | {
      type: 'FILTER_RULE_ADD',
    }

  /** Delete the rule at `ruleIdx` */
  | { type: 'FILTER_RULE_DELETE', ruleIdx: number }

  /** Change the rule type at `ruleIdx` */
  | {
      type: 'FILTER_RULE_TYPE_CHANGE',
      ruleIdx: number,
      oldRule: FilterRuleTemplate | void,
      newRuleType: FilterRuleType,
    }

  /** Change the field that rule at `ruleIdx` applies to */
  | { type: 'FIELD_CHANGE', ruleIdx: number, fieldId: string }

  /** Reset the filter rules according to a QueryResultSpec */
  | { type: 'FILTER_RULES_RESET', queryResultSpec: QueryResultSpec };

export function filterRulesReducer(
  filterRules: Zen.Array<FieldFilterRuleTemplate>,
  action: FilterRuleAction,
): Zen.Array<FieldFilterRuleTemplate> {
  switch (action.type) {
    case 'FILTER_RULE_UPDATE':
      return filterRules.apply(action.ruleIdx, filter => ({
        ...filter,
        rule: action.newFilterRule,
      }));
    case 'FILTER_RULE_ADD':
      return filterRules.push({
        id: uniqueId(),
        fieldId: undefined,
        rule: undefined,
      });
    case 'FIELD_CHANGE':
      return filterRules.apply(action.ruleIdx, filter => ({
        ...filter,
        fieldId: action.fieldId,
      }));
    case 'FILTER_RULE_DELETE':
      return filterRules.delete(action.ruleIdx);
    case 'FILTER_RULE_TYPE_CHANGE':
      return filterRules.apply(action.ruleIdx, filter => ({
        ...filter,
        rule: action.oldRule
          ? castToNewRuleType(action.oldRule, action.newRuleType)
          : createDefaultRule(action.newRuleType),
      }));
    case 'FILTER_RULES_RESET':
      return initializeRuleTemplates(action.queryResultSpec);
    default:
      throw new Error(`Invalid action: ${action.type}`);
  }
}

export default (React.createContext(noop): React.Context<
  $Dispatch<FilterRuleAction>,
>);
