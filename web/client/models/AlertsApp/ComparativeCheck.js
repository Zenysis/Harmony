// @flow
import * as Zen from 'lib/Zen';
import type { Operation } from 'models/AlertsApp/AlertCheckUtil';
import type { Serializable } from 'lib/Zen';

type Values = {
  operation: Operation,
};

type SerializedComparativeCheck = {
  type: 'COMPARATIVE',
  operation: Operation,
};

/**
 * ComparativeCheck is a representation of a check comparing two fields. It contains an
 * operation that defines the condition for an alert to be triggered comparing the fields.
 */
class ComparativeCheck extends Zen.BaseModel<ComparativeCheck, Values>
  implements Serializable<SerializedComparativeCheck> {
  +tag: 'COMPARATIVE' = 'COMPARATIVE';

  static deserialize(
    serializedComparativeCheck: SerializedComparativeCheck,
  ): Zen.Model<ComparativeCheck> {
    const { operation } = serializedComparativeCheck;
    return ComparativeCheck.create({
      operation,
    });
  }

  serialize(): SerializedComparativeCheck {
    const { operation } = this.modelValues();
    return { operation, type: this.tag };
  }
}

export default ((ComparativeCheck: $Cast): Class<Zen.Model<ComparativeCheck>>);
