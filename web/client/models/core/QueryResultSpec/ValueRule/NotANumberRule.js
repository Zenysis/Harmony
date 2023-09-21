// @flow
import * as Zen from 'lib/Zen';
import I18N from 'lib/I18N';
import type { Serializable } from 'lib/Zen';
import type { TestableRule } from 'models/core/QueryResultSpec/ValueRule/TestableRule';

type SerializedNotANumberRule = {
  type: 'NOT_A_NUMBER',
};

/**
 * Test if a value is NAN
 */
class NotANumberRule extends Zen.BaseModel<NotANumberRule, {}>
  implements Serializable<SerializedNotANumberRule>, TestableRule {
  tag: 'NOT_A_NUMBER' = 'NOT_A_NUMBER';

  static deserialize(): Zen.Model<NotANumberRule> {
    return NotANumberRule.create({});
  }

  testValue(val: ?number): boolean {
    return Number.isNaN(val);
  }

  getRuleString(): string {
    return `${I18N.textById('Values')} = NAN`;
  }

  serialize(): SerializedNotANumberRule {
    return {
      type: this.tag,
    };
  }
}

export default ((NotANumberRule: $Cast): Class<Zen.Model<NotANumberRule>>);
