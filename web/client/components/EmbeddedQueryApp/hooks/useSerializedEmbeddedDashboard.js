// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import DashboardQueryItem from 'models/DashboardBuilderApp/DashboardItem/DashboardQueryItem';
import Field from 'models/core/wip/Field';
import FieldFilter from 'models/core/wip/QueryFilter/FieldFilter';
import GroupingItemUtil from 'models/core/wip/GroupingItem/GroupingItemUtil';
import QueryFilterItemUtil from 'models/core/wip/QueryFilterItem/QueryFilterItemUtil';
import QueryResultSpec from 'models/core/QueryResultSpec';
import QuerySelections from 'models/core/wip/QuerySelections';
import SumCalculation from 'models/core/wip/Calculation/SumCalculation';
import useAugmentedQuery from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/QueryTile/hooks/useAugmentedQuery';
import { VISUALIZATION_TO_VIEW_TYPE } from 'models/AdvancedQueryApp/VisualizationType/registry';
import type { EmbeddedDashboard } from 'components/EmbeddedQueryApp/types';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

export default function useSerializedEmbeddedDashboard({
  dashboardFilterItems,
  dashboardGroupingItems,
  item,
}: EmbeddedDashboard): [
  QuerySelections | void,
  QueryResultSpec | void,
  ResultViewType | void,
] {
  const [filterItems, setFilterItems] = React.useState([]);
  const [groupingItems, setGroupingItems] = React.useState([]);

  // HACK(stephen): Create a dummy DashboardQueryItem that we can pass to
  // `useAugmentedQuery` while we wait for everything to deserialize
  // asynchronously. That hook does not expect values to ever be undefined, and
  // we don't want to modify the hook to support that because it is out of scope
  // for its original goal (and embedding is kind of hack anyways).
  const DEFAULT_QUERY_ITEM = React.useMemo(() => {
    const querySelections = QuerySelections.create({
      fields: Zen.Array.create([
        Field.create({
          calculation: SumCalculation.create({
            filter: FieldFilter.create({ fieldId: '__unused__' }),
          }),
          canonicalName: '__unused__',
          id: '__unused__',
          shortName: '__unused__',
        }),
      ]),
      filter: Zen.Array.create(),
      groups: Zen.Array.create(),
    });

    return DashboardQueryItem.create({
      queryResultSpec: QueryResultSpec.fromQuerySelections(
        ['TABLE'],
        querySelections,
      ),
      visualizationType: 'TABLE',
      querySelections,
    });
  }, []);

  const [queryItem, setQueryItem] = React.useState<DashboardQueryItem>(
    DEFAULT_QUERY_ITEM,
  );
  React.useEffect(() => {
    const filterItemsPromise = Promise.all(
      dashboardFilterItems.map(QueryFilterItemUtil.deserializeAsync),
    );

    const groupingItemsPromise = Promise.all(
      dashboardGroupingItems.map(GroupingItemUtil.deserializeAsync),
    );

    const queryItemPromise = DashboardQueryItem.deserializeAsync(item);

    Promise.all([
      filterItemsPromise,
      groupingItemsPromise,
      queryItemPromise,
    ]).then(([filterItemsResult, groupingItemsResult, queryItemResult]) => {
      setFilterItems(filterItemsResult);
      setGroupingItems(groupingItemsResult);
      setQueryItem(queryItemResult);
    });
  }, []);

  const [querySelections, queryResultSpec] = useAugmentedQuery(
    queryItem,
    filterItems,
    groupingItems,
  );

  if (queryItem === DEFAULT_QUERY_ITEM) {
    return [undefined, undefined, undefined];
  }

  return [
    queryItem.querySelections(),
    queryItem.queryResultSpec(),
    VISUALIZATION_TO_VIEW_TYPE[queryItem.visualizationType()],
  ];
}
