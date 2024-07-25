// @flow
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Query from 'components/visualizations/common/Query/Query';
import unsetGroupTotalSetting from 'models/visualizations/common/unsetGroupTotalSetting';
import { API_VERSION } from 'services/APIService';
import type LineGraphQueryResultData from 'models/visualizations/LineGraph/LineGraphQueryResultData';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

const ENDPOINT = 'query/line_graph';

class LineGraphQueryEngine
  implements QueryEngine<Zen.Serialized<LineGraphQueryResultData>> {
  run(
    querySelections: QuerySelections,
  ): Promise<Zen.Serialized<LineGraphQueryResultData>> {
    // The LineGraph visualization cannot handle dimension and granularity
    // subtotals. Disable that setting before we query.
    const groups = unsetGroupTotalSetting(querySelections.groups());
    return Query.create(
      ENDPOINT,
      querySelections.groups(groups).serializeForQuery(),
      API_VERSION.V2,
    ).run();
  }
}

export default (new LineGraphQueryEngine(): LineGraphQueryEngine);
