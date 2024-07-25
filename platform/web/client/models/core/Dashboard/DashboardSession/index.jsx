// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import GroupingItemUtil from 'models/core/wip/GroupingItem/GroupingItemUtil';
import QueryFilterItemUtil from 'models/core/wip/QueryFilterItem/QueryFilterItemUtil';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';
import type { Serializable } from 'lib/Zen';

export type DashboardSessionData = {
  +filters: $ReadOnlyArray<QueryFilterItem>,
  +groupings: $ReadOnlyArray<GroupingItem>,
};

type Values = {
  dashboardId: number,
  dataBlob: DashboardSessionData,
};

type SerializedDashboardSession = {
  dashboardId: number,
  dataBlob: {
    filters: $ReadOnlyArray<Zen.Serialized<QueryFilterItem>>,
    groupings: $ReadOnlyArray<Zen.Serialized<GroupingItem>>,
  },
};

class DashboardSession extends Zen.BaseModel<DashboardSession, Values>
  implements Serializable<SerializedDashboardSession> {
  static deserializeAsync({
    dashboardId,
    dataBlob,
  }: SerializedDashboardSession): Promise<Zen.Model<DashboardSession>> {
    const dashboardFilterPromises = Promise.all(
      dataBlob.filters.map(QueryFilterItemUtil.deserializeAsync),
    );
    const dashboardGroupingPromises = Promise.all(
      dataBlob.groupings.map(GroupingItemUtil.deserializeAsync),
    );
    return Promise.all([
      dashboardFilterPromises,
      dashboardGroupingPromises,
    ]).then(([deserializedFilters, deserializedGroupings]) =>
      DashboardSession.create({
        dashboardId,
        dataBlob: {
          filters: deserializedFilters,
          groupings: deserializedGroupings,
        },
      }),
    );
  }

  serialize(): SerializedDashboardSession {
    const { filters, groupings } = this._.dataBlob();
    return {
      dashboardId: this._.dashboardId(),
      dataBlob: {
        filters: QueryFilterItemUtil.serializeAppliedItems(filters),
        groupings: groupings.map(GroupingItemUtil.serialize),
      },
    };
  }
}

export default ((DashboardSession: $Cast): Class<Zen.Model<DashboardSession>>);
