// @flow
import * as Zen from 'lib/Zen';
import Query from 'components/visualizations/common/Query/Query';
import { API_VERSION } from 'services/APIService';
import type LineGraphQueryResultData from 'components/visualizations/LineGraph/models/LineGraphQueryResultData';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

const ENDPOINT = 'wip/query/line_graph';

class LineGraphQueryEngine
  implements
    QueryEngine<QuerySelections, Zen.Serialized<LineGraphQueryResultData>> {
  run(
    querySelections: QuerySelections,
  ): Promise<Zen.Serialized<LineGraphQueryResultData>> {
    return Query.create(
      ENDPOINT,
      querySelections.serializeForQuery(),
      API_VERSION.V2,
    ).run();
  }
}

export default new LineGraphQueryEngine();
