// @flow
import * as Zen from 'lib/Zen';
import DataAction from 'models/core/QueryResultSpec/DataAction';
import type { Serializable } from 'lib/Zen';

type Values = {
  dataActions: $ReadOnlyArray<DataAction>,
  id: string,
  series: Set<string>,
};

type SerializedDataActionRule = {
  dataActions: $ReadOnlyArray<Zen.Serialized<DataAction>>,
  id: string,
  series: $ReadOnlyArray<string>,
};

/**
 * This model stores a series of `DataActions` and the series that they are applied to
 */
class DataActionRule extends Zen.BaseModel<DataActionRule, Values>
  implements Serializable<SerializedDataActionRule> {
  static deserialize(
    values: SerializedDataActionRule,
  ): Zen.Model<DataActionRule> {
    const { dataActions, id, series } = values;
    return DataActionRule.create({
      id,
      dataActions: Zen.deserializeArray(DataAction, dataActions),
      series: new Set(series),
    });
  }

  serialize(): SerializedDataActionRule {
    return {
      dataActions: Zen.serializeArray(this._.dataActions()),
      id: this._.id(),
      series: [...this._.series()],
    };
  }
}

export default ((DataActionRule: $Cast): Class<Zen.Model<DataActionRule>>);
