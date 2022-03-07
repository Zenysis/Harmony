// @flow
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Query from 'components/visualizations/common/Query/Query';
import unsetGroupTotalSetting from 'models/visualizations/common/unsetGroupTotalSetting';
import { API_VERSION } from 'services/APIService';
import type BoxPlotQueryResultData from 'models/visualizations/BoxPlot/BoxPlotQueryResultData';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

// NOTE(stephen): BoxPlot uses the new BarGraph endpoint. I chose this over
// creating a separate BoxPlot endpoint so that we can apply filters and custom
// calculations to the data and still be able to compute all values needed to
// draw a BoxPlot.
const ENDPOINT = 'query/bar_graph';

class BoxPlotQueryEngine
  implements QueryEngine<Zen.Serialized<BoxPlotQueryResultData>> {
  run(
    querySelections: QuerySelections,
  ): Promise<Zen.Serialized<BoxPlotQueryResultData>> {
    // The BoxPlot visualization would show distorted values if dimension
    // and granularity subtotals were included in the query result.
    const groups = unsetGroupTotalSetting(querySelections.groups());
    return Query.create(
      ENDPOINT,
      querySelections.groups(groups).serializeForQuery(),
      API_VERSION.V2,
    ).run();
  }
}

export default (new BoxPlotQueryEngine(): BoxPlotQueryEngine);
