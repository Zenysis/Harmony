// @flow
import * as Zen from 'lib/Zen';
import Query from 'components/visualizations/common/Query/Query';
import { API_VERSION } from 'services/APIService';
import type HeatTilesQueryResultData from 'models/visualizations/HeatTiles/HeatTilesQueryResultData';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

// TODO(nina): Change this to heat tiles endpoint
const ENDPOINT = 'wip/query/line_graph';

class HeatTilesQueryEngine
  implements
    QueryEngine<QuerySelections, Zen.Serialized<HeatTilesQueryResultData>> {
  run(
    querySelections: QuerySelections,
  ): Promise<Zen.Serialized<HeatTilesQueryResultData>> {
    return Query.create(
      ENDPOINT,
      querySelections.serializeForQuery(),
      API_VERSION.V2,
    ).run();
  }
}

export default new HeatTilesQueryEngine();
