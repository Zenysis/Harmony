// @flow
import * as Zen from 'lib/Zen';
import Field from 'models/core/Field';
import Query from 'components/visualizations/common/Query/Query';
import { BACKEND_GRANULARITIES } from 'components/QueryResult/timeSeriesUtil';
import {
  buildBaseRequest,
  buildQueryFilterFromSelections,
  getDimensionsForQuery,
} from 'components/visualizations/common/Query/util';
import type BarGraphQueryResultData from 'components/visualizations/BarGraph/models/BarGraphQueryResultData';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import type { DruidFilter } from 'components/visualizations/util/druid';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

type BarGraphQueryRequest = {
  dimensions: $ReadOnlyArray<string>,
  endDate: string,
  fields: $ReadOnlyArray<string>,
  granularity: string,
  labelDimensions: $ReadOnlyArray<string>,
  queryFilter: DruidFilter,
  startDate: string,
  valueGroups: { [string]: string },
};

const ENDPOINT = 'query/bar_graph';

function buildRequest(
  querySelections: SimpleQuerySelections,
  queryResultSpec: QueryResultSpec, // eslint-disable-line no-unused-vars
): BarGraphQueryRequest {
  const denominator = querySelections.denominator();
  const denominatorId = denominator ? denominator.id() : undefined;
  const fieldIds = Field.pullIds(querySelections.fields());
  if (denominatorId) {
    fieldIds.push(denominatorId);
  }

  const dimensions = getDimensionsForQuery(querySelections);
  const labelDimensions =
    dimensions.length > 0 ? [querySelections.granularity()] : [];

  return buildBaseRequest(
    dimensions,
    fieldIds,
    BACKEND_GRANULARITIES.ALL,
    buildQueryFilterFromSelections(querySelections),
    querySelections.startDate(),
    querySelections.endDate(),
    labelDimensions,
    denominatorId,
  );
}

// prettier-disable
class BarGraphQueryEngine
  implements
    QueryEngine<
      SimpleQuerySelections,
      Zen.Serialized<BarGraphQueryResultData>,
    > {
  // eslint-disable-next-line class-methods-use-this
  run(
    querySelections: SimpleQuerySelections,
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Serialized<BarGraphQueryResultData>> {
    return Query.create(
      ENDPOINT,
      buildRequest(querySelections, queryResultSpec),
    ).run();
  }
}

export default new BarGraphQueryEngine();
