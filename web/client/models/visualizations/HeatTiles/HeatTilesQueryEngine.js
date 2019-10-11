// @flow
import * as Zen from 'lib/Zen';
import Field from 'models/core/Field';
import Query from 'components/visualizations/common/Query/Query';
import { BACKEND_GRANULARITIES } from 'components/QueryResult/timeSeriesUtil';
import { DruidFilter } from 'components/visualizations/util/druid';
import {
  buildBaseRequest,
  buildQueryFilterFromSelections,
  getDimensionsForQuery,
} from 'components/visualizations/common/Query/util';
import type HeatTilesQueryResultData from 'models/visualizations/HeatTiles/HeatTilesQueryResultData';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

type HeatTilesQueryRequest = {
  dimensions: $ReadOnlyArray<string>,
  endDate: string,
  fields: $ReadOnlyArray<string>,
  granularity: string,
  labelDimensions: $ReadOnlyArray<string>,
  queryFilter: DruidFilter,
  startDate: string,
  valueGroups: { [string]: string },
};

const ENDPOINT = 'query/line_graph';

function buildRequest(
  querySelections: SimpleQuerySelections,
  queryResultSpec: QueryResultSpec, // eslint-disable-line no-unused-vars
): HeatTilesQueryRequest {
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
    BACKEND_GRANULARITIES.MONTH,
    buildQueryFilterFromSelections(querySelections),
    querySelections.startDate(),
    querySelections.endDate(),
    labelDimensions,
    denominatorId,
  );
}

// prettier-ignore
class HeatTilesQueryEngine implements QueryEngine<
  SimpleQuerySelections,
  Zen.Serialized<HeatTilesQueryResultData>,
> {
  run(
    querySelections: SimpleQuerySelections,
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Serialized<HeatTilesQueryResultData>> {
    return Query.create(
      ENDPOINT,
      buildRequest(querySelections, queryResultSpec),
    ).run();
  }
}

export default new HeatTilesQueryEngine();
