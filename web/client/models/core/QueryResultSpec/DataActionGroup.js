// @flow
import * as Zen from 'lib/Zen';
import DataAction from 'models/core/QueryResultSpec/DataAction';
import type { Serializable } from 'lib/Zen';

type Values = {
  dataActions: Zen.Array<DataAction>,
};

type SerializedDataActionGroup = $ReadOnlyArray<Zen.Serialized<DataAction>>;

/**
 * This represents a group of DataActions to be applied to a field on the
 * frontend. The data actions are applied sequentially. Each DataAction has
 * a rule and a color or transformedText, so any data that passes a data
 * action's rule will be assigned that action's color or text. If a data passes
 * multiple rules, it will receive the color or text of the last action whose
 * rule it passed.
 */
class DataActionGroup extends Zen.BaseModel<DataActionGroup, Values>
  implements Serializable<SerializedDataActionGroup> {
  static deserialize(
    dataActions: SerializedDataActionGroup,
  ): Zen.Model<DataActionGroup> {
    return DataActionGroup.create({
      dataActions: Zen.deserializeToZenArray(DataAction, dataActions),
    });
  }

  /**
   * Apply the color actions to this value and determine what final color is
   * assigned to this value. Return undefined if this value does not pass any
   * color rule.
   */
  getValueColor(
    value: ?number,
    allValues: $ReadOnlyArray<?number>,
    defaultColor?: string,
  ): string | void {
    return this._.dataActions().reduce(
      (currColor, colorAction) =>
        colorAction.testValue(value, allValues)
          ? colorAction.color()
          : currColor,
      defaultColor,
    );
  }

  /**
   * Find the DataAction corresponding to this value. Return undefined if this does
   * pass any color rule
   */
  getValueDataAction(
    allValues: $ReadOnlyArray<?number>,
    value: ?number,
  ): DataAction | void {
    return this._.dataActions().reduce((currActionRule, colorAction) =>
      colorAction.testValue(value, allValues) ? colorAction : currActionRule,
    );
  }

  getTransformedText(
    value: ?number,
    allValues: $ReadOnlyArray<?number>,
    defaultText?: string,
  ): string | void {
    return this._.dataActions().reduce(
      (currText, dataAction) =>
        dataAction.testValue(value, allValues)
          ? dataAction.transformedText()
          : currText,
      defaultText,
    );
  }

  serialize(): SerializedDataActionGroup {
    return Zen.serializeArray(
      this._.dataActions().filter(
        action =>
          action.color() !== '' ||
          action.transformedText() !== undefined ||
          action.transformedText !== '',
      ),
    );
  }
}

export default ((DataActionGroup: $Cast): Class<Zen.Model<DataActionGroup>>);
