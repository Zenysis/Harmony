// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type Values = {
  /**
   * The formatted HTML text that the user has built.
   */
  text: string,
};

type DefaultValues = {
  /**
   * Whether or not to autosize the height of the text tile to the height of the
   * contents. When switched on we always autosize, when off we simply use it as
   * a mimimum height, to allow for user inserted whitespace. It only affects
   * non-legacy dashboards.
   */
  autosize: boolean,
};

type SerializedDashboardTextItem = {
  autosize: boolean,
  text: string,
  type: 'TEXT_ITEM',
};

/**
 * The DashboardTextItem contains formatted text that the user has created.
 */
class DashboardTextItem
  extends Zen.BaseModel<DashboardTextItem, Values, DefaultValues>
  implements Serializable<SerializedDashboardTextItem> {
  +tag: 'TEXT_ITEM' = 'TEXT_ITEM';
  static defaultValues: DefaultValues = { autosize: true };
  static deserialize(
    serializedDashboardTestItem: SerializedDashboardTextItem,
  ): Zen.Model<DashboardTextItem> {
    const { autosize, text } = serializedDashboardTestItem;
    return DashboardTextItem.create({ autosize, text });
  }

  serialize(): SerializedDashboardTextItem {
    const { autosize, text } = this.modelValues();
    return { autosize, text, type: this.tag };
  }
}

export default ((DashboardTextItem: $Cast): Class<
  Zen.Model<DashboardTextItem>,
>);
