// @flow
import * as Zen from 'lib/Zen';
import Field from 'models/core/Field';
import Query from 'components/visualizations/common/Query/Query';
import { BACKEND_GRANULARITIES } from 'components/QueryResult/timeSeriesUtil';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/common';
import {
  buildBaseRequest,
  buildQueryFilterFromSelections,
  getDimensionsForQuery,
} from 'components/visualizations/common/Query/util';
import type LineGraphQueryResultData from 'components/visualizations/LineGraph/models/LineGraphQueryResultData';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import type { DruidFilter } from 'components/visualizations/util/druid';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

type LineGraphQueryRequest = {
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
  queryResultSpec: QueryResultSpec,
): LineGraphQueryRequest {
  const denominator = querySelections.denominator();
  const denominatorId = denominator ? denominator.id() : undefined;
  const fieldIds = Field.pullIds(querySelections.fields());
  if (denominatorId) {
    fieldIds.push(denominatorId);
  }

  const dimensions = getDimensionsForQuery(querySelections);
  const labelDimensions =
    dimensions.length > 0 ? [querySelections.granularity()] : [];

  let bucketType = BACKEND_GRANULARITIES.MONTH;
  if (queryResultSpec) {
    const controls = queryResultSpec.getVisualizationControls(
      RESULT_VIEW_TYPES.TIME,
    );
    // HACK(toshi): bucketType is 'NONE' when pulled from legacy dashboards
    if (controls.bucketType !== 'NONE') {
      bucketType = BACKEND_GRANULARITIES[controls.bucketType];
    }
  }

  return buildBaseRequest(
    dimensions,
    fieldIds,
    bucketType,
    buildQueryFilterFromSelections(querySelections),
    querySelections.startDate(),
    querySelections.endDate(),
    labelDimensions,
    denominatorId,
  );
}

// prettier-ignore
class LineGraphQueryEngine implements QueryEngine<
  SimpleQuerySelections,
  Zen.Serialized<LineGraphQueryResultData>,
> {
  run(
    querySelections: SimpleQuerySelections,
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Serialized<LineGraphQueryResultData>> {
    return Query.create(
      ENDPOINT,
      buildRequest(querySelections, queryResultSpec),
    ).run();
  }
}

export default new LineGraphQueryEngine();
