// @flow
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Query from 'components/visualizations/common/Query/Query';
import unsetGroupTotalSetting from 'models/visualizations/common/unsetGroupTotalSetting';
import { API_VERSION } from 'services/APIService';
import type HeatTilesQueryResultData from 'models/visualizations/HeatTiles/HeatTilesQueryResultData';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

const ENDPOINT = 'query/line_graph';

class HeatTilesQueryEngine
  implements QueryEngine<Zen.Serialized<HeatTilesQueryResultData>> {
  run(
    querySelections: QuerySelections,
  ): Promise<Zen.Serialized<HeatTilesQueryResultData>> {
    // The HeatTiles visualization would show distorted values if dimension
    // and granularity subtotals were included in the query result.
    const groups = unsetGroupTotalSetting(querySelections.groups());
    return Query.create(
      ENDPOINT,
      querySelections.groups(groups).serializeForQuery(),
      API_VERSION.V2,
    ).run();
  }
}

export default (new HeatTilesQueryEngine(): HeatTilesQueryEngine);
