// @flow
import * as Zen from 'lib/Zen';
import ValueRuleUtil from 'models/core/QueryResultSpec/ValueRule/ValueRuleUtil';
import type { Serializable } from 'lib/Zen';
import type {
  SerializedValueRule,
  ValueRule,
} from 'models/core/QueryResultSpec/ValueRule/types';

type Values = {
  color: string,
  label: string,
  rule: ValueRule,
  transformedText: string | void,
};

type SerializedDataAction = {
  color: string,
  label: string,
  rule: SerializedValueRule,
  transformedText: string | void,
};

/**
 * This stores a rule to test some data with, and what color any value passing
 * that rule should be assigned.
 */
class DataAction extends Zen.BaseModel<DataAction, Values>
  implements Serializable<SerializedDataAction> {
  static deserialize(values: SerializedDataAction): Zen.Model<DataAction> {
    const { color, label, rule, transformedText } = values;
    return DataAction.create({
      color,
      label,
      transformedText,
      rule: ValueRuleUtil.deserialize(rule),
    });
  }

  getRuleString(allValues: $ReadOnlyArray<?number>): string {
    return ValueRuleUtil.getRuleString(this._.rule(), allValues);
  }

  testValue(val: ?number, allValues: $ReadOnlyArray<?number>): boolean {
    return ValueRuleUtil.testValue(this._.rule(), val, allValues);
  }

  serialize(): SerializedDataAction {
    return {
      color: this._.color(),
      label: this._.label(),
      rule: this._.rule().serialize(),
      transformedText: this._.transformedText(),
    };
  }
}

export default ((DataAction: $Cast): Class<Zen.Model<DataAction>>);
