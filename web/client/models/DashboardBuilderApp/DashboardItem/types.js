// @flow
import type DashboardDividerItem from 'models/DashboardBuilderApp/DashboardItem/DashboardDividerItem';
import type DashboardGISItem from 'models/DashboardBuilderApp/DashboardItem/DashboardGISItem';
import type DashboardIFrameItem from 'models/DashboardBuilderApp/DashboardItem/DashboardIFrameItem';
import type DashboardPlaceholderItem from 'models/DashboardBuilderApp/DashboardItem/DashboardPlaceholderItem';
import type DashboardQueryItem from 'models/DashboardBuilderApp/DashboardItem/DashboardQueryItem';
import type DashboardSpacerItem from 'models/DashboardBuilderApp/DashboardItem/DashboardSpacerItem';
import type DashboardTextItem from 'models/DashboardBuilderApp/DashboardItem/DashboardTextItem';

// The union of all possible dashboard tile types.
export type DashboardItemType =
  | DashboardDividerItem
  | DashboardGISItem
  | DashboardIFrameItem
  | DashboardPlaceholderItem
  | DashboardQueryItem
  | DashboardSpacerItem
  | DashboardTextItem;
