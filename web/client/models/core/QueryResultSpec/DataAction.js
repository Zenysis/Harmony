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
  rule: ValueRule,
  label: string,
  transformedText: string | void,
};

type SerializedDataAction = {
  color: string,
  rule: SerializedValueRule,
  label: string,
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
      rule: ValueRuleUtil.deserialize(rule),
      transformedText,
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
      rule: this._.rule().serialize(),
      label: this._.label(),
      transformedText: this._.transformedText(),
    };
  }
}

export default ((DataAction: $Cast): Class<Zen.Model<DataAction>>);
