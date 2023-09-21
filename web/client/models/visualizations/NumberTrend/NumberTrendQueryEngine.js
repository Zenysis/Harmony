// @flow
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Query from 'components/visualizations/common/Query/Query';
import { API_VERSION } from 'services/APIService';
import type NumberTrendQueryResultData from 'models/visualizations/NumberTrend/NumberTrendQueryResultData';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

const ENDPOINT = 'query/hierarchy';

// Modify the groups selected by the user to include at most one date grouping
// and *zero* non-date groupings. The NumberTrend visualization can show a big
// number and a spark line and NOTHING ELSE.
function updateGroups(
  groups: Zen.Array<GroupingItem>,
): Zen.Array<GroupingItem> {
  if (groups.isEmpty()) {
    return groups;
  }
  return groups.filter(group => group.tag === 'GROUPING_GRANULARITY');
}

class NumberTrendQueryEngine
  implements QueryEngine<Zen.Serialized<NumberTrendQueryResultData>> {
  run(
    querySelections: QuerySelections,
  ): Promise<Zen.Serialized<NumberTrendQueryResultData>> {
    const newGroups = updateGroups(querySelections.groups());
    return Query.create(
      ENDPOINT,
      querySelections.groups(newGroups).serializeForQuery(),
      API_VERSION.V2,
    ).run();
  }
}

export default (new NumberTrendQueryEngine(): NumberTrendQueryEngine);
