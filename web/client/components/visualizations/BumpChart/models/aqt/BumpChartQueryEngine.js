// @flow
import * as Zen from 'lib/Zen';
import Query from 'components/visualizations/common/Query/Query';
import { API_VERSION } from 'services/APIService';
import type BumpChartQueryResultData from 'components/visualizations/BumpChart/models/BumpChartQueryResultData';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

const ENDPOINT = 'wip/query/line_graph';

class BumpChartQueryEngine
  implements
    QueryEngine<QuerySelections, Zen.Serialized<BumpChartQueryResultData>> {
  run(
    querySelections: QuerySelections,
    queryResultSpec: QueryResultSpec, // eslint-disable-line no-unused-vars
  ): Promise<Zen.Serialized<BumpChartQueryResultData>> {
    return Query.create(
      ENDPOINT,
      querySelections.serializeForQuery(),
      API_VERSION.V2,
    ).run();
  }
}

export default new BumpChartQueryEngine();
