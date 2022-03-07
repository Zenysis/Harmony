// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';
import type { TestableRule } from 'models/core/QueryResultSpec/ValueRule/TestableRule';

type SerializedEqualToNullRule = {
  type: 'EQUAL_TO_NULL',
};

const TEXT = t('models.core.QueryResultSpec.ValueRule');

/**
 * Test if a value is null or undefined
 */
class EqualToNullRule extends Zen.BaseModel<EqualToNullRule, {}>
  implements Serializable<SerializedEqualToNullRule>, TestableRule {
  tag: 'EQUAL_TO_NULL' = 'EQUAL_TO_NULL';

  static deserialize(): Zen.Model<EqualToNullRule> {
    return EqualToNullRule.create({});
  }

  testValue(val: ?number): boolean {
    return val === null || val === undefined;
  }

  getRuleString(): string {
    return `${TEXT.values} = null`;
  }

  serialize(): SerializedEqualToNullRule {
    return {
      type: this.tag,
    };
  }
}

export default ((EqualToNullRule: $Cast): Class<Zen.Model<EqualToNullRule>>);
