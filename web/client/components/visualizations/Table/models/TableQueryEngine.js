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
import type QueryResultSeries from 'models/core/QueryResultSpec/QueryResultSeries';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import type TableQueryResultData from 'components/visualizations/Table/models/TableQueryResultData';
import type { DruidFilter } from 'components/visualizations/util/druid';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

type TableQueryRequest = {
  dimensions: $ReadOnlyArray<string>,
  endDate: string,
  fields: $ReadOnlyArray<string>,
  granularity: string,
  labelDimensions: $ReadOnlyArray<string>,
  queryFilter: DruidFilter,
  startDate: string,
  valueGroups: { [string]: string },
};

const ENDPOINT = 'query/table';

export function extractConstituentSettings(seriesObjects: {
  +[string]: QueryResultSeries,
}): Set<string> {
  const output = new Set();
  Object.keys(seriesObjects).forEach(fieldId => {
    if (seriesObjects[fieldId].showConstituents()) {
      output.add(fieldId);
    }
  });
  return output;
}

// Collect all field IDs to query. Include a field's constituents if the user
// has requested it.
function getFieldsToQuery(
  querySelections: SimpleQuerySelections,
  queryResultSpec: QueryResultSpec,
): $ReadOnlyArray<string> {
  const output = [];
  const seriesObjects = queryResultSpec
    .getSeriesSettings(RESULT_VIEW_TYPES.TABLE)
    .seriesObjects();
  const constituentsShown = extractConstituentSettings(seriesObjects);

  querySelections.fields().forEach(field => {
    const fieldId = field.id();
    output.push(fieldId);
    if (constituentsShown.has(fieldId)) {
      output.push(...Field.pullIds(field.constituents()));
    }
  });

  const denominator = querySelections.denominator();
  if (denominator) {
    output.push(denominator.id());
  }
  return output;
}

export function buildRequest(
  querySelections: SimpleQuerySelections,
  queryResultSpec: QueryResultSpec,
): TableQueryRequest {
  const denominator = querySelections.denominator();
  const denominatorId = denominator ? denominator.id() : undefined;

  return buildBaseRequest(
    getDimensionsForQuery(querySelections),
    getFieldsToQuery(querySelections, queryResultSpec),
    BACKEND_GRANULARITIES.ALL,
    buildQueryFilterFromSelections(querySelections),
    querySelections.startDate(),
    querySelections.endDate(),
    [],
    denominatorId,
  );
}

// prettier-ignore
class TableQueryEngine implements QueryEngine<
  SimpleQuerySelections,
  Zen.Serialized<TableQueryResultData>,
> {
  // eslint-disable-next-line class-methods-use-this
  run(
    querySelections: SimpleQuerySelections,
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Serialized<TableQueryResultData>> {
    return Query.create(
      ENDPOINT,
      buildRequest(querySelections, queryResultSpec),
    ).run();
  }
}

export default new TableQueryEngine();
