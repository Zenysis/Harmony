// @flow
import * as Zen from 'lib/Zen';
import Query from 'components/visualizations/common/Query/Query';
import { API_VERSION } from 'services/APIService';
import type BubbleChartQueryResultData from 'components/visualizations/BubbleChart/models/BubbleChartQueryResultData';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

// Bubble chart uses the BarGraph endpoint since it provides a nice result
// format to work with.
const ENDPOINT = 'wip/query/bar_graph_tng';

// prettier-ignore
class BubbleChartQueryEngine implements QueryEngine<
  QuerySelections,
  Zen.Serialized<BubbleChartQueryResultData>,
> {
  run(
    querySelections: QuerySelections,
    queryResultSpec: QueryResultSpec, // eslint-disable-line no-unused-vars
  ): Promise<Zen.Serialized<BubbleChartQueryResultData>> {
    return Query.create(
      ENDPOINT,
      querySelections.serializeForQuery(),
      API_VERSION.V2,
    ).run();
  }
}

export default new BubbleChartQueryEngine();
