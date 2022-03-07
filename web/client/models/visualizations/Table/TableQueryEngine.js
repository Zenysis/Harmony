// @flow
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Query from 'components/visualizations/common/Query/Query';
import { API_VERSION } from 'services/APIService';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type TableQueryResultData from 'models/visualizations/Table/TableQueryResultData';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

const ENDPOINT = 'query/table';

class TableQueryEngine
  implements QueryEngine<Zen.Serialized<TableQueryResultData>> {
  run(
    querySelections: QuerySelections,
  ): Promise<Zen.Serialized<TableQueryResultData>> {
    return Query.create(
      ENDPOINT,
      querySelections.serializeForQuery(),
      API_VERSION.V2,
    ).run();
  }
}

export default (new TableQueryEngine(): TableQueryEngine);
