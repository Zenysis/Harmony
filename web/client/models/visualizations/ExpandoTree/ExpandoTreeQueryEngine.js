// @flow
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Query from 'components/visualizations/common/Query/Query';
import { API_VERSION } from 'services/APIService';
import type ExpandoTreeQueryResultData from 'models/visualizations/ExpandoTree/ExpandoTreeQueryResultData';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

const ENDPOINT = 'query/hierarchy';

type SerializedExpandoTreeQueryResultData = {
  // NOTE(pablo): ideally this object spread shouldn't be necessary, but we're
  // doing this just to make things type-check correctly
  ...Zen.Serialized<ExpandoTreeQueryResultData>,
};

class ExpandoTreeQueryEngine
  implements QueryEngine<SerializedExpandoTreeQueryResultData> {
  run(
    querySelections: QuerySelections,
  ): Promise<SerializedExpandoTreeQueryResultData> {
    return Query.create(
      ENDPOINT,
      querySelections.serializeForQuery(),
      API_VERSION.V2,
    ).run();
  }
}

export default (new ExpandoTreeQueryEngine(): ExpandoTreeQueryEngine);
