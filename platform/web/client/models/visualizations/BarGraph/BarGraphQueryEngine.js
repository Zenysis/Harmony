// @flow
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Query from 'components/visualizations/common/Query/Query';
import { API_VERSION } from 'services/APIService';
import type BarGraphQueryResultData from 'models/visualizations/BarGraph/BarGraphQueryResultData';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

const ENDPOINT = 'query/bar_graph';

class BarGraphQueryEngine
  implements QueryEngine<Zen.Serialized<BarGraphQueryResultData>> {
  run(
    querySelections: QuerySelections,
  ): Promise<Zen.Serialized<BarGraphQueryResultData>> {
    return Query.create(
      ENDPOINT,
      querySelections.serializeForQuery(),
      API_VERSION.V2,
    ).run();
  }
}

export default (new BarGraphQueryEngine(): BarGraphQueryEngine);
