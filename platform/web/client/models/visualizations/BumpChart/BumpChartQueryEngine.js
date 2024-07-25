// @flow
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Query from 'components/visualizations/common/Query/Query';
import unsetGroupTotalSetting from 'models/visualizations/common/unsetGroupTotalSetting';
import { API_VERSION } from 'services/APIService';
import type BumpChartQueryResultData from 'models/visualizations/BumpChart/BumpChartQueryResultData';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

const ENDPOINT = 'query/line_graph';

class BumpChartQueryEngine
  implements QueryEngine<Zen.Serialized<BumpChartQueryResultData>> {
  run(
    querySelections: QuerySelections,
  ): Promise<Zen.Serialized<BumpChartQueryResultData>> {
    // The BumpChart visualization cannot handle dimension and granularity
    // subtotals. Disable that setting before we query.
    const groups = unsetGroupTotalSetting(querySelections.groups());
    return Query.create(
      ENDPOINT,
      querySelections.groups(groups).serializeForQuery(),
      API_VERSION.V2,
    ).run();
  }
}

export default (new BumpChartQueryEngine(): BumpChartQueryEngine);
