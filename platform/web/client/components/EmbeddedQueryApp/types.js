// @flow
import * as Zen from 'lib/Zen';
import type DashboardQueryItem from 'models/DashboardBuilderApp/DashboardItem/DashboardQueryItem';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

export type QueryResultPieces = {
  queryResultSpec: QueryResultSpec,
  querySelections: QuerySelections,
  viewType: ResultViewType,
};

export type EmbeddedDashboard = {
  dashboardFilterItems: $ReadOnlyArray<Zen.Serialized<QueryFilterItem>>,
  dashboardGroupingItems: $ReadOnlyArray<Zen.Serialized<GroupingItem>>,
  item: Zen.Serialized<DashboardQueryItem>,
};

export type EmbeddedQuery = {
  queryResultSpec: Zen.Serialized<QueryResultSpec>,
  querySelections: Zen.Serialized<QuerySelections>,
  viewType: ResultViewType,
};

export type EmbedRequest = {
  dashboard?: EmbeddedDashboard,
  height: number,
  query?: EmbeddedQuery,
  width: number,
};
