// @flow
import * as Zen from 'lib/Zen';
import DataAction from 'models/core/QueryResultSpec/DataAction';
import type { Serializable } from 'lib/Zen';

type Values = {
  id: string,
  series: Set<string>,
  dataActions: $ReadOnlyArray<DataAction>,
};

type SerializedDataActionRule = {
  id: string,
  series: $ReadOnlyArray<string>,
  dataActions: $ReadOnlyArray<Zen.Serialized<DataAction>>,
};

/**
 * This model stores a series of `DataActions` and the series that they are applied to
 */
class DataActionRule extends Zen.BaseModel<DataActionRule, Values>
  implements Serializable<SerializedDataActionRule> {
  static deserialize(
    values: SerializedDataActionRule,
  ): Zen.Model<DataActionRule> {
    const { id, series, dataActions } = values;
    return DataActionRule.create({
      id,
      series: new Set(series),
      dataActions: Zen.deserializeArray(DataAction, dataActions),
    });
  }

  serialize(): SerializedDataActionRule {
    return {
      id: this._.id(),
      series: [...this._.series()],
      dataActions: Zen.serializeArray(this._.dataActions()),
    };
  }
}

export default ((DataActionRule: $Cast): Class<Zen.Model<DataActionRule>>);
