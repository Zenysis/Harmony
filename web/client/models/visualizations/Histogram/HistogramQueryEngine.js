// @flow
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Query from 'components/visualizations/common/Query/Query';
import { API_VERSION } from 'services/APIService';
import type HistogramQueryResultData from 'models/visualizations/Histogram/HistogramQueryResultData';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

// Histogram uses the new BarGraph endpoint because the underlying core
// visualization is the same (ui/visualizations/BarGraph).
const ENDPOINT = 'query/bar_graph';

// Modify the groups selected by the user to include total values in all
// non-date groups. This is needed to support the different ways the Histogram
// can be broken down. (It is similar to how the `hierarchy` endpoint works,
// only we are making the change on the frontend instead of the backend).
function updateGroups(
  groups: Zen.Array<GroupingItem>,
): Zen.Array<GroupingItem> {
  // NOTE(stephen): Even though it is only really possible to have at most one
  // date and one non-date grouping, I don't want that logic to live this deep.
  // Handle the possibility that this requirement is not enforced.
  const nonDateGroupings = [];
  const dateGroupings = [];
  groups.forEach(group => {
    if (group.tag === 'GROUPING_GRANULARITY') {
      // The histogram cannot handle a time subtotal since it expects all time
      // values to be valid.
      dateGroupings.push(group.includeTotal(false));
    } else {
      nonDateGroupings.push(group.includeTotal(true));
    }
  });

  // NOTE(stephen): Need to make sure the date group is first so that the total
  // values get calculated in the correct order.
  return Zen.Array.create([...dateGroupings, ...nonDateGroupings]);
}

class HistogramQueryEngine
  implements QueryEngine<Zen.Serialized<HistogramQueryResultData>> {
  run(
    querySelections: QuerySelections,
  ): Promise<Zen.Serialized<HistogramQueryResultData>> {
    const newGroups = updateGroups(querySelections.groups());
    return Query.create(
      ENDPOINT,
      querySelections.groups(newGroups).serializeForQuery(),
      API_VERSION.V2,
    ).run();
  }
}

export default (new HistogramQueryEngine(): HistogramQueryEngine);
