// @flow
import BarGraphQueryResultState from 'components/visualizations/BarGraph/models/BarGraphQueryResultState';
import BoxPlotQueryResultState from 'components/visualizations/BoxPlot/models/BoxPlotQueryResultState';
import BubbleChartQueryResultState from 'components/visualizations/BubbleChart/models/sqt/BubbleChartQueryResultState';
import BumpChartQueryResultState from 'components/visualizations/BumpChart/models/BumpChartQueryResultState';
import ExpandoTreeQueryResultState from 'components/visualizations/ExpandoTree/models/sqt/ExpandoTreeQueryResultState';
import HeatTilesQueryResultState from 'models/visualizations/HeatTiles/HeatTilesQueryResultState';
import LegacyQueryResultData from 'components/visualizations/common/legacy/models/LegacyQueryResultData';
import LineGraphQueryResultState from 'components/visualizations/LineGraph/models/LineGraphQueryResultState';
import MapQueryResultState from 'components/visualizations/Map/models/MapQueryResultState';
import QueryResultState from 'models/core/QueryResultState';
import SunburstQueryResultState from 'components/visualizations/Sunburst/models/sqt/SunburstQueryResultState';
import TableQueryResultState from 'components/visualizations/Table/models/TableQueryResultState';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/viewTypes';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

class NoopQueryEngine implements QueryEngine<SimpleQuerySelections, any> {
  // eslint-disable-next-line class-methods-use-this,no-unused-vars
  run(...args): * {
    throw new Error('NoopQueryEngine should never be called.');
  }
}

const noopResultStateValues = {
  queryEngine: new NoopQueryEngine(),
  shouldRebuildQueryResult: () => false,
  shouldRunNewQuery: () => false,
};

// Create a QueryResultState class that does nothing. shouldRebuildQueryResult
// and shouldRunNewQuery always return false, and the QueryResultData must
// always be set directly. This class is a placeholder needed to begin migrating
// QueryResult component to start using the QueryResultState class without
// needing all visualizations to support it.
function createLegacyQueryResultState(): QueryResultState<
  SimpleQuerySelections,
  Class<LegacyQueryResultData>,
> {
  return QueryResultState.createInitialState(
    noopResultStateValues.queryEngine,
    LegacyQueryResultData,
    noopResultStateValues.shouldRebuildQueryResult,
    noopResultStateValues.shouldRunNewQuery,
  );
}

// QueryResultState models that can process the simple SimpleQuerySelections
// type used by the original query form.
// eslint-disable-next-line import/prefer-default-export
export const SIMPLE_SELECTIONS_QUERY_RESULT_STATES: {
  [ResultViewType]: QueryResultState<SimpleQuerySelections, any>,
} = {
  [RESULT_VIEW_TYPES.CHART]: BarGraphQueryResultState,
  [RESULT_VIEW_TYPES.TIME]: LineGraphQueryResultState,
  [RESULT_VIEW_TYPES.BOX]: BoxPlotQueryResultState,
  [RESULT_VIEW_TYPES.TABLE]: TableQueryResultState,
  [RESULT_VIEW_TYPES.MAP]: MapQueryResultState,
  [RESULT_VIEW_TYPES.ANIMATED_MAP]: createLegacyQueryResultState(),
  [RESULT_VIEW_TYPES.HEATMAP]: createLegacyQueryResultState(),
  [RESULT_VIEW_TYPES.HEATTILES]: HeatTilesQueryResultState,
  [RESULT_VIEW_TYPES.BUBBLE_CHART]: BubbleChartQueryResultState,
  [RESULT_VIEW_TYPES.BUMP_CHART]: BumpChartQueryResultState,
  [RESULT_VIEW_TYPES.SUNBURST]: SunburstQueryResultState,
  [RESULT_VIEW_TYPES.EXPANDOTREE]: ExpandoTreeQueryResultState,
  [RESULT_VIEW_TYPES.GEOMAP]: createLegacyQueryResultState(),
};
