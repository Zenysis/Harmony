// @flow
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import DashboardIFrameItem from 'models/DashboardBuilderApp/DashboardItem/DashboardIFrameItem';
import DashboardTextItem from 'models/DashboardBuilderApp/DashboardItem/DashboardTextItem';
import type { Serializable } from 'lib/Zen';

// These are the possible placeholder tile types that can be shown.
// NOTE(stephen): This naming convention matches the types used by the legacy
// DashboardPlaceholder model.
export type PlaceholderItemType = 'iframe' | 'query' | 'text_item';

type Values = {
  /**
   * The concrete tile type that this placeholder tile will represent.
   */
  itemType: PlaceholderItemType,
};

type SerializedDashboardPlaceholderItem = {
  itemType: PlaceholderItemType,
  type: 'PLACEHOLDER_ITEM',
};

/**
 * The DashboardPlaceholderItem represents a placeholder tile that can be filled
 * in by the user with actual data. When the user edits a placeholder tile, the
 * placeholder will be removed and the concrete dashboard item type that the
 * placeholder represents will be added in its place.
 */
class DashboardPlaceholderItem
  extends Zen.BaseModel<DashboardPlaceholderItem, Values>
  implements Serializable<SerializedDashboardPlaceholderItem> {
  +tag: 'PLACEHOLDER_ITEM' = 'PLACEHOLDER_ITEM';
  static deserialize(
    serializedDashboardPlaceholderItem: SerializedDashboardPlaceholderItem,
  ): Zen.Model<DashboardPlaceholderItem> {
    const { itemType } = serializedDashboardPlaceholderItem;
    return DashboardPlaceholderItem.create({ itemType });
  }

  serialize(): SerializedDashboardPlaceholderItem {
    return { itemType: this._.itemType(), type: this.tag };
  }

  /**
   * Build a concrete model instance from the type that the placeholder is
   * holding.
   */
  createEmptyItem(): DashboardIFrameItem | DashboardTextItem {
    const type = this._.itemType();

    // NOTE(david): We cannot create an empty an empty DashboardQueryItem as
    // creating a queryResultSpec requires at least one field in
    // QuerySelections.
    invariant(type !== 'query', 'Cannot create an emtpy query item');

    if (type === 'iframe') {
      return DashboardIFrameItem.create({});
    }

    (type: 'text_item');
    return DashboardTextItem.create({ text: '' });
  }
}

export default ((DashboardPlaceholderItem: $Cast): Class<
  Zen.Model<DashboardPlaceholderItem>,
>);
