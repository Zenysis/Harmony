// @flow
import * as Zen from 'lib/Zen';
import QueryFilterUtil from 'models/core/wip/QueryFilter/QueryFilterUtil';
import type {
  QueryFilter,
  SerializedQueryFilter,
} from 'models/core/wip/QueryFilter/types';
import type { Serializable } from 'lib/Zen';

export type WindowOperation = 'average' | 'max' | 'min' | 'sum';

type RequiredValues = {
  filter: QueryFilter,
};

type DefaultValues = {
  +operation: WindowOperation,
  +size: number,
};

type SerializedWindowCalculation = {
  type: 'WINDOW',
  filter: SerializedQueryFilter,
  operation: 'average' | 'max' | 'min' | 'sum',
  size: number,
};

/**
 * Calculate values over a moving window.
 */
class WindowCalculation
  extends Zen.BaseModel<WindowCalculation, RequiredValues, DefaultValues>
  implements Serializable<SerializedWindowCalculation> {
  static defaultValues: DefaultValues = {
    operation: 'sum',
    size: 2,
  };

  tag: 'WINDOW' = 'WINDOW';

  static deserializeAsync(
    values: SerializedWindowCalculation,
  ): Promise<Zen.Model<WindowCalculation>> {
    return QueryFilterUtil.deserializeAsync(values.filter).then(filter =>
      WindowCalculation.create({
        filter,
        operation: values.operation,
        size: values.size,
      }),
    );
  }

  static UNSAFE_deserialize(
    values: SerializedWindowCalculation,
  ): Zen.Model<WindowCalculation> {
    return WindowCalculation.create({
      filter: QueryFilterUtil.UNSAFE_deserialize(values.filter),
      operation: values.operation,
      size: values.size,
    });
  }

  serialize(): SerializedWindowCalculation {
    return {
      type: this.tag,
      filter: this._.filter().serialize(),
      operation: this._.operation(),
      size: this._.size(),
    };
  }
}

export default ((WindowCalculation: $Cast): Class<
  Zen.Model<WindowCalculation>,
>);
