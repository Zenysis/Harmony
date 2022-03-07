// @flow
import * as Zen from 'lib/Zen';
import GroupingItemUtil from 'models/core/wip/GroupingItem/GroupingItemUtil';
import QueryFilterItemUtil from 'models/core/wip/QueryFilterItem/QueryFilterItemUtil';
import type {
  GroupingItem,
  SerializedGroupingItem,
} from 'models/core/wip/GroupingItem/types';
import type {
  QueryFilterItem,
  SerializedQueryFilterItem,
} from 'models/core/wip/QueryFilterItem/types';
import type { Serializable } from 'lib/Zen';

export type CommonQueryTileSettings<
  T:
    | GroupingItem
    | QueryFilterItem
    | SerializedQueryFilterItem
    | SerializedGroupingItem,
> = {
  /**
   * List of category IDs that are available for the user to select
   * items from. If the array is empty, this indicates that *all* items are
   * available for selection. This makes it so that dashboards that want to
   * allow all elements to be selectable do not accidentally exclude *new*
   * categories that are added for a deployment after the array was first built.
   */
  enabledCategories: $ReadOnlyArray<string>,

  /**
   * The list of query tile IDs that the common dashboard items (filters or
   * groups) should not be applied to.
   */
  excludedTiles: $ReadOnlyArray<string>,

  /**
   * Query selections modifications that will be applied to all eligible query
   * tiles on the dashboard.
   */
  items: $ReadOnlyArray<T>,

  /**
   * Whether these settings should be visible on the dashboard or hidden.
   */
  visible: boolean,
};

type DefaultValues = {
  /**
   * The common filter settings that will be applied to all eligible query tiles
   * on the dashboard.
   */
  filterSettings: CommonQueryTileSettings<QueryFilterItem>,

  /**
   * The common grouping settings that will be applied to all eligible query
   * tiles on the dashboard.
   */
  groupingSettings: CommonQueryTileSettings<GroupingItem>,

  // TODO(david): Remove this setting when we remove legacy dashboards. All
  // modern dashboards should have a left aligned panel.
  /**
   * Where the common settings panel should be shown on the page.
   */
  panelAlignment: 'LEFT' | 'TOP',
};

type SerializedDashboardCommonSettings = {
  filterSettings: CommonQueryTileSettings<SerializedQueryFilterItem>,
  groupingSettings: CommonQueryTileSettings<SerializedGroupingItem>,
  panelAlignment: 'LEFT' | 'TOP',
};

/**
 * The DashboardCommonSettings model holds settings that the user is changing
 * for many tiles on the dashboard. Right now, this includes filter and grouping
 * changes that will override the selections made for individual query tiles.
 */
class DashboardCommonSettings
  extends Zen.BaseModel<DashboardCommonSettings, {}, DefaultValues>
  implements Serializable<SerializedDashboardCommonSettings> {
  static defaultValues: DefaultValues = {
    filterSettings: {
      enabledCategories: [],
      excludedTiles: [],
      items: [],
      visible: false,
    },
    groupingSettings: {
      enabledCategories: [],
      excludedTiles: [],
      items: [],
      visible: false,
    },
    panelAlignment: 'LEFT',
  };

  static deserializeAsync(
    serializedDashboardCommonSettings: SerializedDashboardCommonSettings,
  ): Promise<Zen.Model<DashboardCommonSettings>> {
    const {
      filterSettings,
      groupingSettings,
      panelAlignment,
    } = serializedDashboardCommonSettings;

    const filterItemsPromise = Promise.all(
      filterSettings.items.map(QueryFilterItemUtil.deserializeAsync),
    );

    const groupingItemsPromise = Promise.all(
      groupingSettings.items.map(GroupingItemUtil.deserializeAsync),
    );

    return Promise.all([filterItemsPromise, groupingItemsPromise]).then(
      ([filterItems, groupingItems]) =>
        DashboardCommonSettings.create({
          filterSettings: {
            ...filterSettings,
            items: filterItems,
          },
          groupingSettings: {
            ...groupingSettings,
            items: groupingItems,
          },
          panelAlignment,
        }),
    );
  }

  serialize(): SerializedDashboardCommonSettings {
    const {
      filterSettings,
      groupingSettings,
      panelAlignment,
    } = this.modelValues();
    return {
      filterSettings: {
        ...filterSettings,
        items: QueryFilterItemUtil.serializeAppliedItems(filterSettings.items),
      },
      groupingSettings: {
        ...groupingSettings,
        items: groupingSettings.items.map(GroupingItemUtil.serialize),
      },
      panelAlignment,
    };
  }
}

export default ((DashboardCommonSettings: $Cast): Class<
  Zen.Model<DashboardCommonSettings>,
>);
