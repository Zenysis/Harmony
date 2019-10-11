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
import type BubbleChartQueryResultData from 'components/visualizations/BubbleChart/models/BubbleChartQueryResultData';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import type TableQueryResultData from 'components/visualizations/Table/models/TableQueryResultData';
import type { DruidFilter } from 'components/visualizations/util/druid';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

type BubbleChartQueryRequest = {
  dimensions: $ReadOnlyArray<string>,
  endDate: string,
  fields: $ReadOnlyArray<string>,
  granularity: string,
  labelDimensions: $ReadOnlyArray<string>,
  queryFilter: DruidFilter,
  startDate: string,
  valueGroups: { [string]: string },
};

// In SQT, we use the Table endpoint instead of the new BarGraph endpoint
// because the new bar graph is not supported in SQT. This behavior, while
// uncommon, is worth doing because the Table response can be easily transformed
// into the desired respone type. We just prefer the BarGraph's style over
// the Table's because it is easier to type and work with.
const ENDPOINT = 'query/table';

// The Table endpoint produces results in a flattened object with dimensions and
// metrics side by side. We need to separate the dimensions and metrics into
// two separate objects so that we can match the BubbleChart's desired data
// structure format.
function transformTableResponse(
  values: Zen.Serialized<TableQueryResultData>,
  fieldIDs: $ReadOnlyArray<string>,
): Zen.Serialized<BubbleChartQueryResultData> {
  const { data, dimensions: dimensionIDs } = values;
  const transformedData = data.map(tableDataPoint => {
    const dimensions = {};
    const metrics = {};
    dimensionIDs.forEach(dimensionID => {
      dimensions[dimensionID] = tableDataPoint[dimensionID];
    });
    fieldIDs.forEach(fieldID => {
      metrics[fieldID] = tableDataPoint[fieldID];
    });
    return { dimensions, metrics };
  });

  return {
    data: transformedData,
    dimensions: dimensionIDs,
  };
}

function buildRequest(
  querySelections: SimpleQuerySelections,
  queryResultSpec: QueryResultSpec, // eslint-disable-line no-unused-vars
): BubbleChartQueryRequest {
  const denominator = querySelections.denominator();
  const denominatorID = denominator ? denominator.id() : undefined;
  const fieldIDs = Field.pullIds(querySelections.fields());
  if (denominatorID) {
    fieldIDs.push(denominatorID);
  }

  const dimensions = getDimensionsForQuery(querySelections);
  const labelDimensions =
    dimensions.length > 0 ? [querySelections.granularity()] : [];

  return buildBaseRequest(
    dimensions,
    fieldIDs,
    BACKEND_GRANULARITIES.ALL,
    buildQueryFilterFromSelections(querySelections),
    querySelections.startDate(),
    querySelections.endDate(),
    labelDimensions,
    denominatorID,
  );
}

// prettier-disable
class BubbleChartQueryEngine
  implements
    QueryEngine<
      SimpleQuerySelections,
      Zen.Serialized<BubbleChartQueryResultData>,
    > {
  // eslint-disable-next-line class-methods-use-this
  run(
    querySelections: SimpleQuerySelections,
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Serialized<BubbleChartQueryResultData>> {
    const request = buildRequest(querySelections, queryResultSpec);
    return Query.create(ENDPOINT, request)
      .run()
      .then(response => transformTableResponse(response, request.fields));
  }
}

export default new BubbleChartQueryEngine();
