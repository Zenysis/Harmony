// @flow
import * as React from 'react';

import QueryResult from 'components/QueryResult';
import QueryScalingContext from 'components/common/QueryScalingContext';
import useAugmentedQuery from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/QueryTile/hooks/useAugmentedQuery';
import useCaseManagementInfoContext from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/QueryTile/hooks/useCaseManagementInfoContext';
import useScalingSettings from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/QueryTile/hooks/useScalingSettings';
import { VISUALIZATION_TO_VIEW_TYPE } from 'models/AdvancedQueryApp/VisualizationType/registry';
import type DashboardQueryItem from 'models/DashboardBuilderApp/DashboardItem/DashboardQueryItem';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type Props = {
  collapse: boolean,

  /**
   * Common dashboard-level filters that should apply to this tile's query
   * selections.
   */
  dashboardFilterItems: $ReadOnlyArray<QueryFilterItem>,

  /**
   * Common dashboard-level groupings that should replace this tile's query
   * groupings.
   */
  dashboardGroupingItems: $ReadOnlyArray<GroupingItem>,
  item: DashboardQueryItem,
  onItemChange: DashboardQueryItem => void,
  presenting: boolean,

  /**
   * The height that this query tile should be drawn to before scaling is app
   * applied.
   */
  referenceHeight: number,

  /**
   * The width that this query tile should be drawn to before scaling is app
   * applied.
   */
  referenceWidth: number,

  /**
   * A scaling factor that will increase or decrease the size of the tile to the
   * true size that it should be rendered to on the dashboard.
   */
  scaleFactor: number,
};

/**
 * The QueryTile renders a visualization produced by the query tool. If there
 * are dashboard-level filters or groups to apply, then the query being issued
 * will change. The QueryTile will also perform scaling so that the
 * visualization shown looks good regardless of the screen resolution of the
 * user.
 */
function QueryTile({
  collapse,
  dashboardFilterItems,
  dashboardGroupingItems,
  item,
  onItemChange,
  presenting,
  referenceHeight,
  referenceWidth,
  scaleFactor,
}: Props) {
  const visualizationType = item.visualizationType();
  const [querySelections, queryResultSpec] = useAugmentedQuery(
    item,
    dashboardFilterItems,
    dashboardGroupingItems,
  );
  const [containerStyle, innerStyle, queryScalingContext] = useScalingSettings(
    collapse,
    visualizationType,
    referenceHeight,
    referenceWidth,
    scaleFactor,
  );
  const caseManagementInfoContext = useCaseManagementInfoContext();

  // NOTE(stephen): There are subtle bugs hidden here. Because we have to modify
  // the `queryResultSpec` when there are dashboard-level groupings, we lose the
  // ability to apply changes to the *original* queryResultSpec based on changes
  // that the user can make to the visualization. If the visualization allows
  // modifications directly on the tile *without* going into edit mode, then the
  // queryResultSpec will be changed. If that visualization also has a
  // non-default `updateFromNewGroupBySettings`, then we can have an issue. An
  // example would be if the Table viz stored column sort state in the
  // TableSettings instead of in state. The user might have a custom theme
  // applied for the individual groupings on the *original* query that the tile
  // was added to the dashboard with. When the user views the dashboard and
  // changes the dashboard-level groupings, then the queryResultSpec will
  // change for this tile *locally only*. If the user saves the dashboard at
  // this point, then the original settings will be fine. However, if they then
  // change the sort state for a column, the queryResultSpec will change at the
  // *dashboard* level. We have no way of applying those changes to the original
  // spec: they are applied to the spec that has dashboard-level groupings
  // applied to it. This spec then goes up the tree to be stored. The stored
  // spec in the dashboard now contains visualization settings that were
  // modified with the `updateFromNewGroupBySettings` method. If the user then
  // removes the dashboard-level groupings, then there will be no way to get
  // back to the original pre-dashboard-level groupings change AND also include
  // their latest change that happened on the viz.
  // TODO(david): Discuss and work out what to do about this!
  const onQueryResultSpecChange = React.useCallback(
    newSpec => onItemChange(item.queryResultSpec(newSpec)),
    [item, onItemChange],
  );

  return (
    <div
      className="gd-dashboard-query-tile result-container"
      style={containerStyle}
    >
        <QueryScalingContext.Provider value={queryScalingContext}>
          <div
            className="gd-dashboard-query-tile__query-result-view"
            style={innerStyle}
          >
            <QueryResult
              enableMobileMode={collapse}
              enableWarningMessages={!presenting}
              onQueryResultSpecChange={onQueryResultSpecChange}
              queryResultSpec={queryResultSpec}
              querySelections={querySelections}
              smallMode
              viewType={VISUALIZATION_TO_VIEW_TYPE[visualizationType]}
            />
          </div>
        </QueryScalingContext.Provider>
    </div>
  );
}

export default (React.memo(QueryTile): React.AbstractComponent<Props>);
