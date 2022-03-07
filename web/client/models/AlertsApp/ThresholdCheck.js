// @flow
import * as Zen from 'lib/Zen';
import type { Operation } from 'models/AlertsApp/AlertCheckUtil';
import type { Serializable } from 'lib/Zen';

type Values = {
  operation: Operation,
  threshold: number,
};

type SerializedThresholdCheck = {
  type: 'THRESHOLD',
  operation: Operation,
  threshold: number,
};

/**
 * ThresholdCheck is a representation of threshold values.
 * It contains a numeric threshold value and an operation that defines
 * whether the alert is triggered when less than, equal to, or greater than
 * the threshold value
 */
class ThresholdCheck extends Zen.BaseModel<ThresholdCheck, Values>
  implements Serializable<SerializedThresholdCheck> {
  +tag: 'THRESHOLD' = 'THRESHOLD';

  static deserialize(
    serializedThresholdCheck: SerializedThresholdCheck,
  ): Zen.Model<ThresholdCheck> {
    const { operation, threshold } = serializedThresholdCheck;
    return ThresholdCheck.create({
      operation,
      threshold,
    });
  }

  serialize(): SerializedThresholdCheck {
    const { operation, threshold } = this.modelValues();
    return { operation, threshold, type: this.tag };
  }
}

export default ((ThresholdCheck: $Cast): Class<Zen.Model<ThresholdCheck>>);
