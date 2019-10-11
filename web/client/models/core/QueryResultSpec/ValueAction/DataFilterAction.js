// @flow
import * as Zen from 'lib/Zen';
import ValueRuleUtil from 'models/core/QueryResultSpec/ValueRule/ValueRuleUtil';
import type { FilterRule } from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/types';
import type {
  TestableRule,
  ValueRule,
} from 'models/core/QueryResultSpec/ValueRule/types';

type OperationMap = {
  KEEP: 'KEEP',
  REMOVE: 'REMOVE',
};

type Values = {
  rule: ValueRule & TestableRule,
  operation: $Values<OperationMap>,
};

/**
 * TODO(pablo): remove this once the Filter/Color modal no longer creates
 * the legacy filter selection types
 * @deprecated
 */
function _isLegacyRemoveAction(filterModalRule: FilterRule) {
  const { actionOption } = filterModalRule;
  if (actionOption) {
    return (
      actionOption === 'remove_top' ||
      actionOption === 'remove_bottom' ||
      actionOption === 'remove_above' ||
      actionOption === 'remove_below' ||
      actionOption === 'remove_above_average' ||
      actionOption === 'remove_below_average' ||
      actionOption === 'remove_values_equal_to_zero' ||
      actionOption === 'remove_values_equal_to_null'
    );
  }
  return false;
}

/**
 * This stores a rule to test some data with, and what operation to perform on
 * the values that pass that rule.
 */
class DataFilterAction extends Zen.BaseModel<DataFilterAction, Values> {
  static Operations: OperationMap = {
    KEEP: 'KEEP',
    REMOVE: 'REMOVE',
  };

  static createFromFilterModalSelections(
    filterModalRule: FilterRule,
  ): Zen.Model<DataFilterAction> | void {
    if (_isLegacyRemoveAction(filterModalRule)) {
      return DataFilterAction.create({
        rule: ValueRuleUtil.createFromLegacyFilterRule(filterModalRule),
        operation: 'REMOVE',
      });
    }
    return undefined;
  }

  /**
   * Tests if a single value should be kept
   */
  shouldValueBeKept(val: ?number, allValues: $ReadOnlyArray<?number>): boolean {
    const { operation, rule } = this.modelValues();
    switch (operation) {
      case DataFilterAction.Operations.KEEP:
        return rule.testValue(val, allValues);
      case DataFilterAction.Operations.REMOVE:
        return !rule.testValue(val, allValues);
      default:
        throw new Error(`[DataFilter] Invalid operation ${operation}`);
    }
  }
}

export default ((DataFilterAction: any): Class<Zen.Model<DataFilterAction>>);
