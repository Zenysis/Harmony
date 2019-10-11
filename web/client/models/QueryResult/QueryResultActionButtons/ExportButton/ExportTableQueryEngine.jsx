// @flow
import * as Zen from 'lib/Zen';
import Query from 'components/visualizations/common/Query/Query';
import { buildRequest } from 'components/visualizations/Table/models/TableQueryEngine';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import type TableQueryResultData from 'components/visualizations/Table/models/TableQueryResultData';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

const ENDPOINT = 'query/table';

// HACK(stephen): There is not a good way to set the query granularity with the
// current TableQueryEngine. This is because the current table viz does not
// support anything other than the 'all' granularity. To workaround this, we
// reimplement a copy of the TableQueryEngine but with our granularity
// hack added in.
export default class ExportTableQueryEngine
  implements
    QueryEngine<SimpleQuerySelections, Zen.Serialized<TableQueryResultData>> {
  granularity: string;

  constructor(granularity: string) {
    this.granularity = granularity;
  }

  run(
    querySelections: SimpleQuerySelections,
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Serialized<TableQueryResultData>> {
    const request = buildRequest(querySelections, queryResultSpec);
    request.granularity = this.granularity;
    return Query.create(ENDPOINT, request).run();
  }
}
