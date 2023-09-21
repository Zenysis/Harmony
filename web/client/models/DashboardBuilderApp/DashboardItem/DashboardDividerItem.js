// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type SerializedDashboardDividerItem = {
  type: 'DIVIDER_ITEM',
};

/**
 * The DashboardDividerItem is a horizontal line that provides visual separation.
 */
class DashboardDividerItem extends Zen.BaseModel<DashboardDividerItem>
  implements Serializable<SerializedDashboardDividerItem> {
  +tag: 'DIVIDER_ITEM' = 'DIVIDER_ITEM';
  static deserialize(
    // eslint-disable-next-line no-unused-vars
    serializedDashboardDividerItem: SerializedDashboardDividerItem,
  ): Zen.Model<DashboardDividerItem> {
    return DashboardDividerItem.create({});
  }

  serialize(): SerializedDashboardDividerItem {
    return { type: this.tag };
  }
}

export default ((DashboardDividerItem: $Cast): Class<
  Zen.Model<DashboardDividerItem>,
>);
