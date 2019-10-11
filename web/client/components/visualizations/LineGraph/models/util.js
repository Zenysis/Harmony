// @flow
import { RESULT_VIEW_TYPES } from 'components/QueryResult/viewTypes';
import { SORT_DESCENDING } from 'components/QueryResult/graphUtil';
import { sortNumeric } from 'util/util';
import type LineGraphQueryResultData from 'components/visualizations/LineGraph/models/LineGraphQueryResultData';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { LineGraphLine } from 'components/visualizations/LineGraph/types';

export function getControls(resultSpec: QueryResultSpec) {
  return resultSpec.getVisualizationControls(RESULT_VIEW_TYPES.TIME);
}

export function hasBucketTypeChanged(
  newResultSpec: QueryResultSpec,
  prevResultSpec?: QueryResultSpec,
): boolean {
  if (!prevResultSpec) {
    return true;
  }
  const newControls = getControls(newResultSpec);
  const prevControls = getControls(prevResultSpec);
  return newControls.bucketType !== prevControls.bucketType;
}

/**
 * Returns the top (or bottom, depending on `isDescending)  `limit` number of
 * geographies. Current approach is to take the max of all fields of a given
 * geo, and then sort depending on `isDescending`.
 */
function _getNValues(
  queryResultData: LineGraphQueryResultData,
  isDescending: boolean,
  limit: number,
): $ReadOnlyArray<{ key: string, val: number }> {
  const totals = queryResultData.totals();

  // Collect max values of all lines
  const maxValList = Object.keys(totals).map(geoName => {
    const geoEntry = totals[geoName];

    // NOTE(toshi): We are filtering out forecast error, and instead relying
    // only on cumulative values of a given line. However, we may want to allow
    // users to select on option where ranking is based on forecast error.
    const nonErrorFieldIds = Object.keys(geoEntry).filter(
      fieldId => !fieldId.includes('forecast_error'),
    );
    const valArray = nonErrorFieldIds.map(fieldId => geoEntry[fieldId]);
    const maxValue = Math.max(...valArray);

    return {
      key: geoName,
      val: maxValue,
    };
  });

  // Sort list
  maxValList.sort((a, b) => sortNumeric(a.val, b.val, isDescending));

  // Limit the number of entries returned, only return the data object
  return maxValList.slice(0, limit);
}

export default function parseResultsAndApplySettings(
  queryResultData: LineGraphQueryResultData,
  queryResultSpec: QueryResultSpec,
): LineGraphLine {
  const controls = queryResultSpec.getVisualizationControls(
    RESULT_VIEW_TYPES.TIME,
  );

  // Get list of truncated data
  const isDescending = controls.sortOrder === SORT_DESCENDING;
  const truncatedData = _getNValues(
    queryResultData,
    isDescending,
    controls.resultLimit,
  );

  // Here we want to store relevant lines
  const dimensionToLineMap = {};
  truncatedData.forEach(dataEntry => {
    dimensionToLineMap[dataEntry.key] = [];
  });

  // Collect lines for items identified in truncatedData
  queryResultData.data().forEach(geoObj => {
    const dimension = geoObj.key;
    if (dimension in dimensionToLineMap) {
      dimensionToLineMap[dimension].push(geoObj);
    }
  });

  // Collect all lines
  const lineList: LineGraphLine = Object.keys(dimensionToLineMap).map(
    dimension => dimensionToLineMap[dimension],
  );

  return lineList;
}
