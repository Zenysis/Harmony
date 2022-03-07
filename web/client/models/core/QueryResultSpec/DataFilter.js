// @flow
import * as Zen from 'lib/Zen';
import ValueRuleUtil from 'models/core/QueryResultSpec/ValueRule/ValueRuleUtil';
import type { Serializable } from 'lib/Zen';
import type {
  SerializedValueRule,
  ValueRule,
} from 'models/core/QueryResultSpec/ValueRule/types';

type Values = {
  /** The rule that this data filter will apply */
  rule: ValueRule,

  /** The operation to apply if the rule passes (e.g. keep or remove data) */
  operation: 'KEEP' | 'REMOVE',
};

type SerializedDataFilter = {
  rule: SerializedValueRule,
  operation: 'KEEP' | 'REMOVE',
};

/**
 * This stores a rule to test some data with, and what operation to perform on
 * the values that pass that rule.
 */
class DataFilter extends Zen.BaseModel<DataFilter, Values>
  implements Serializable<SerializedDataFilter> {
  static deserialize(values: SerializedDataFilter): Zen.Model<DataFilter> {
    const { rule, operation } = values;
    return DataFilter.create({
      operation,
      rule: ValueRuleUtil.deserialize(rule),
    });
  }

  /**
   * Tests if a single value should be kept
   */
  shouldValueBeKept(val: ?number, allValues: $ReadOnlyArray<?number>): boolean {
    const { operation, rule } = this.modelValues();
    switch (operation) {
      case 'KEEP':
        return ValueRuleUtil.testValue(rule, val, allValues);
      case 'REMOVE':
        return !ValueRuleUtil.testValue(rule, val, allValues);
      default:
        throw new Error(`[DataFilter] Invalid operation ${operation}`);
    }
  }

  serialize(): SerializedDataFilter {
    return {
      ...this.modelValues(),
      rule: this._.rule().serialize(),
    };
  }
}

export default ((DataFilter: $Cast): Class<Zen.Model<DataFilter>>);
