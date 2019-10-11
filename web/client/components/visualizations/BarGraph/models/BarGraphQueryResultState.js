// @flow
import BarGraphQueryEngine from 'components/visualizations/BarGraph/models/BarGraphQueryEngine';
import BarGraphQueryResultData from 'components/visualizations/BarGraph/models/BarGraphQueryResultData';
import QueryResultState from 'models/core/QueryResultState';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/common';
import { buildBarSettings } from 'components/visualizations/BarGraph/util';
import { hasChanged } from 'util/ZenModel/ZenModelUtil';
import { objKeyEq } from 'util/objUtil';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';

type BarSettings = {
  color: string,
  disabled: boolean,
  showValues: boolean,
  strokeWidth: number | void,
  valueFontSize: number,
  y2Axis: boolean,
};

function _equals(
  curBarSettings: BarSettings,
  prevBarSettings: BarSettings,
): boolean {
  return Object.keys(curBarSettings).every(
    key => curBarSettings[key] === prevBarSettings[key],
  );
}

function barSettingsChanged(
  newResultSpec: QueryResultSpec,
  prevResultSpec: QueryResultSpec,
): boolean {
  const newSeriesSettings = newResultSpec.getSeriesSettings(
    RESULT_VIEW_TYPES.CHART,
  );
  const prevSeriesSettings = prevResultSpec.getSeriesSettings(
    RESULT_VIEW_TYPES.CHART,
  );
  const newDisabledFields = newResultSpec.getVisualizationControls(
    RESULT_VIEW_TYPES.CHART,
  ).disabledFields;
  const prevDisabledFields = prevResultSpec.getVisualizationControls(
    RESULT_VIEW_TYPES.CHART,
  ).disabledFields;

  if (
    newSeriesSettings === prevSeriesSettings &&
    newDisabledFields === prevDisabledFields
  ) {
    return false;
  }

  const newSeriesObjects = newSeriesSettings.seriesObjects();
  const prevSeriesObjects = prevSeriesSettings.seriesObjects();
  return (
    newSeriesSettings.seriesOrder() !== prevSeriesSettings.seriesOrder() ||
    !Object.keys(newSeriesObjects).every(key => {
      const cur = newSeriesObjects[key];
      const prev = prevSeriesObjects[key];
      const curDisabled = !!newDisabledFields[key];
      const prevDisabled = !!prevDisabledFields[key];
      return (
        (cur === prev && curDisabled === prevDisabled) ||
        _equals(
          buildBarSettings(cur, curDisabled),
          buildBarSettings(prev, prevDisabled),
        )
      );
    })
  );
}

function controlsChanged(
  newResultSpec: QueryResultSpec,
  prevResultSpec: QueryResultSpec,
): boolean {
  const newControls = newResultSpec.getVisualizationControls(
    RESULT_VIEW_TYPES.CHART,
  );
  const prevControls = prevResultSpec.getVisualizationControls(
    RESULT_VIEW_TYPES.CHART,
  );
  if (newControls === prevControls) {
    return false;
  }

  return !objKeyEq(newControls, prevControls, [
    'resultLimit',
    'y2LineGraph',
    'sortOn',
    'sortOrder',
    'stackBars',
  ]);
}

export function shouldRebuildQueryResult(
  newResultSpec: QueryResultSpec,
  prevResultSpec?: QueryResultSpec,
): boolean {
  if (!prevResultSpec) {
    return true;
  }

  return (
    controlsChanged(newResultSpec, prevResultSpec) ||
    barSettingsChanged(newResultSpec, prevResultSpec) ||
    hasChanged<QueryResultSpec>('customFields', 'filters')(
      newResultSpec,
      prevResultSpec,
    )
  );
}

function shouldRunNewQuery(
  newSelections: SimpleQuerySelections,
  newResultSpec: QueryResultSpec,
  prevSelections?: SimpleQuerySelections,
  prevResultSpec?: QueryResultSpec, // eslint-disable-line no-unused-vars
): boolean {
  // If selections have changed, we must issue a new query. Currently, no
  // post-query settings can cause the query to change.
  return newSelections !== prevSelections;
}

const BarGraphQueryResultState: QueryResultState<
  SimpleQuerySelections,
  Class<BarGraphQueryResultData>,
> = QueryResultState.createInitialState(
  BarGraphQueryEngine,
  BarGraphQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default BarGraphQueryResultState;
