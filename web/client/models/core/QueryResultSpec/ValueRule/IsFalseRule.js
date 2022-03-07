// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';
import type { TestableRule } from 'models/core/QueryResultSpec/ValueRule/TestableRule';

type SerializedIsFalseRule = {
  type: 'IS_FALSE',
};

const TEXT = t('models.core.QueryResultSpec.ValueRule');

/**
 * Test if a number value is false. We do this by checking if the value is
 * equal to 0. Nulls and undefined don't count as false.
 */
class IsFalseRule extends Zen.BaseModel<IsFalseRule, {}>
  implements Serializable<SerializedIsFalseRule>, TestableRule {
  tag: 'IS_FALSE' = 'IS_FALSE';

  static deserialize(): Zen.Model<IsFalseRule> {
    return IsFalseRule.create({});
  }

  testValue(val: ?number): boolean {
    return val === 0;
  }

  getRuleString(): string {
    return TEXT.IsFalseRule.ruleString;
  }

  serialize(): SerializedIsFalseRule {
    return {
      type: this.tag,
    };
  }
}

export default ((IsFalseRule: $Cast): Class<Zen.Model<IsFalseRule>>);
