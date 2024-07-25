// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import DashboardDividerItem from 'models/DashboardBuilderApp/DashboardItem/DashboardDividerItem';
import DashboardGISItem from 'models/DashboardBuilderApp/DashboardItem/DashboardGISItem';
import DashboardIFrameItem from 'models/DashboardBuilderApp/DashboardItem/DashboardIFrameItem';
import DashboardPlaceholderItem from 'models/DashboardBuilderApp/DashboardItem/DashboardPlaceholderItem';
import DashboardQueryItem from 'models/DashboardBuilderApp/DashboardItem/DashboardQueryItem';
import DashboardSpacerItem from 'models/DashboardBuilderApp/DashboardItem/DashboardSpacerItem';
import DashboardTextItem from 'models/DashboardBuilderApp/DashboardItem/DashboardTextItem';
import type { DashboardItemType } from 'models/DashboardBuilderApp/DashboardItem/types';

export type SerializedDashboardItem =
  | Zen.Serialized<DashboardDividerItem>
  | Zen.Serialized<DashboardGISItem>
  | Zen.Serialized<DashboardIFrameItem>
  | Zen.Serialized<DashboardPlaceholderItem>
  | Zen.Serialized<DashboardQueryItem>
  | Zen.Serialized<DashboardSpacerItem>
  | Zen.Serialized<DashboardTextItem>;

export function deserializeAsyncDashboardItem(
  serializedItem: SerializedDashboardItem,
): Promise<DashboardItemType> {
  if (serializedItem.type === 'DIVIDER_ITEM') {
    return Promise.resolve(DashboardDividerItem.deserialize(serializedItem));
  }
  if (serializedItem.type === 'GIS_ITEM') {
    return DashboardGISItem.deserializeAsync(serializedItem);
  }
  if (serializedItem.type === 'IFRAME_ITEM') {
    return Promise.resolve(DashboardIFrameItem.deserialize(serializedItem));
  }
  if (serializedItem.type === 'PLACEHOLDER_ITEM') {
    return Promise.resolve(
      DashboardPlaceholderItem.deserialize(serializedItem),
    );
  }
  if (serializedItem.type === 'QUERY_ITEM') {
    return DashboardQueryItem.deserializeAsync(serializedItem);
  }
  if (serializedItem.type === 'SPACER_ITEM') {
    return Promise.resolve(DashboardSpacerItem.deserialize(serializedItem));
  }
  return Promise.resolve(DashboardTextItem.deserialize(serializedItem));
}
