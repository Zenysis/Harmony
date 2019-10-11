// @flow
import * as Zen from 'lib/Zen';
import Field from 'models/core/Field';
import Query from 'components/visualizations/common/Query/Query';
import { BACKEND_GRANULARITIES } from 'components/QueryResult/timeSeriesUtil';
import {
  buildBaseRequest,
  buildQueryFilterFromSelections,
} from 'components/visualizations/common/Query/util';
import type BoxPlotQueryResultData from 'components/visualizations/BoxPlot/models/BoxPlotQueryResultData';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import type { DruidFilter } from 'components/visualizations/util/druid';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

type BoxPlotQueryRequest = {
  dimensions: $ReadOnlyArray<string>,
  endDate: string,
  fields: $ReadOnlyArray<string>,
  granularity: string,
  labelDimensions: $ReadOnlyArray<string>,
  queryFilter: DruidFilter,
  startDate: string,
  valueGroups: { [string]: string },
};

const ENDPOINT = 'query/box_plot';

function buildRequest(
  querySelections: SimpleQuerySelections,
  queryResultSpec: QueryResultSpec, // eslint-disable-line no-unused-vars
): BoxPlotQueryRequest {
  const denominator = querySelections.denominator();
  const denominatorId = denominator ? denominator.id() : undefined;
  const fieldIds = Field.pullIds(querySelections.fields());
  if (denominatorId) {
    fieldIds.push(denominatorId);
  }

  return buildBaseRequest(
    [querySelections.granularity()],
    fieldIds,
    BACKEND_GRANULARITIES.MONTH,
    buildQueryFilterFromSelections(querySelections),
    querySelections.startDate(),
    querySelections.endDate(),
    [],
    denominatorId,
  );
}

// prettier-ignore
class BoxPlotQueryEngine implements QueryEngine<
  SimpleQuerySelections,
  Zen.Serialized<BoxPlotQueryResultData>,
> {
  // eslint-disable-next-line class-methods-use-this
  run(
    querySelections: SimpleQuerySelections,
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Serialized<BoxPlotQueryResultData>> {
    return Query.create(
      ENDPOINT,
      buildRequest(querySelections, queryResultSpec),
    ).run();
  }
}

export default new BoxPlotQueryEngine();
