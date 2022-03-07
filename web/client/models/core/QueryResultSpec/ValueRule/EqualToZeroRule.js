// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';
import type { TestableRule } from 'models/core/QueryResultSpec/ValueRule/TestableRule';

type SerializedEqualToZeroRule = {
  type: 'EQUAL_TO_ZERO',
};

const TEXT = t('models.core.QueryResultSpec.ValueRule');

/**
 * Test if a value is equal to zero
 */
class EqualToZeroRule extends Zen.BaseModel<EqualToZeroRule, {}>
  implements Serializable<SerializedEqualToZeroRule>, TestableRule {
  tag: 'EQUAL_TO_ZERO' = 'EQUAL_TO_ZERO';

  static deserialize(): Zen.Model<EqualToZeroRule> {
    return EqualToZeroRule.create({});
  }

  testValue(val: ?number): boolean {
    return val === 0;
  }

  getRuleString(): string {
    return `${TEXT.values} = 0`;
  }

  serialize(): SerializedEqualToZeroRule {
    return {
      type: this.tag,
    };
  }
}

export default ((EqualToZeroRule: $Cast): Class<Zen.Model<EqualToZeroRule>>);
