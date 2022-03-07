// @flow
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Query from 'components/visualizations/common/Query/Query';
import unsetGroupTotalSetting from 'models/visualizations/common/unsetGroupTotalSetting';
import { API_VERSION } from 'services/APIService';
import type BubbleChartQueryResultData from 'models/visualizations/BubbleChart/BubbleChartQueryResultData';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

// Bubble chart uses the BarGraph endpoint since it provides a nice result
// format to work with.
const ENDPOINT = 'query/bar_graph';

class BubbleChartQueryEngine
  implements QueryEngine<Zen.Serialized<BubbleChartQueryResultData>> {
  run(
    querySelections: QuerySelections,
  ): Promise<Zen.Serialized<BubbleChartQueryResultData>> {
    // The BubbleChart visualization would show distorted values if dimension
    // and granularity subtotals were included in the query result.
    const groups = unsetGroupTotalSetting(querySelections.groups());
    return Query.create(
      ENDPOINT,
      querySelections.groups(groups).serializeForQuery(),
      API_VERSION.V2,
    ).run();
  }
}

export default (new BubbleChartQueryEngine(): BubbleChartQueryEngine);
