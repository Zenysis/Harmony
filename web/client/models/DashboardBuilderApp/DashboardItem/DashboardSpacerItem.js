// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type SerializedDashboardSpacerItem = {
  type: 'SPACER_ITEM',
};

/**
 * The DashboardSpacerItem represents intentional whitespace on a dashboard.
 *
 * NOTE(david): This is an empty model with only a tag property. We make it a
 * ZenModel though so that it has the same interface as other dashboard item
 * models.
 */
class DashboardSpacerItem extends Zen.BaseModel<DashboardSpacerItem>
  implements Serializable<SerializedDashboardSpacerItem> {
  +tag: 'SPACER_ITEM' = 'SPACER_ITEM';
  static deserialize(
    // eslint-disable-next-line no-unused-vars
    serializedDashboardSpacerItem: SerializedDashboardSpacerItem,
  ): Zen.Model<DashboardSpacerItem> {
    return DashboardSpacerItem.create({});
  }

  serialize(): SerializedDashboardSpacerItem {
    return { type: this.tag };
  }
}

export default ((DashboardSpacerItem: $Cast): Class<
  Zen.Model<DashboardSpacerItem>,
>);
