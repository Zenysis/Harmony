// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';
import type { TestableRule } from 'models/core/QueryResultSpec/ValueRule/TestableRule';

type SerializedIsTrueRule = {
  type: 'IS_TRUE',
};

const TEXT = t('models.core.QueryResultSpec.ValueRule');

/**
 * Test if a number value is true. We do this by checking if the value is
 * any value greater than 0.
 */
class IsTrueRule extends Zen.BaseModel<IsTrueRule, {}>
  implements Serializable<SerializedIsTrueRule>, TestableRule {
  tag: 'IS_TRUE' = 'IS_TRUE';

  static deserialize(): Zen.Model<IsTrueRule> {
    return IsTrueRule.create({});
  }

  testValue(val: ?number): boolean {
    if (val === null || val === undefined) {
      return false;
    }
    return val > 0;
  }

  getRuleString(): string {
    return TEXT.IsTrueRule.ruleString;
  }

  serialize(): SerializedIsTrueRule {
    return {
      type: this.tag,
    };
  }
}

export default ((IsTrueRule: $Cast): Class<Zen.Model<IsTrueRule>>);
