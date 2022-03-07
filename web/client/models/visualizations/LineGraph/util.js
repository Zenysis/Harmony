// @flow
import { SORT_DESCENDING } from 'components/QueryResult/graphUtil';
import { sortNumeric } from 'util/arrayUtil';
import type LineGraphSettings from 'models/visualizations/LineGraph/LineGraphSettings';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type {
  DataPoint,
  LineGraphLines,
  TotalForKey,
} from 'models/visualizations/LineGraph/types';

export function getControls(resultSpec: QueryResultSpec): LineGraphSettings {
  return resultSpec.getVisualizationControls('TIME');
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
  return newControls.bucketType() !== prevControls.bucketType();
}

/**
 * Returns the top (or bottom, depending on `isDescending)  `limit` number of
 * geographies. Current approach is to take the max of all fields of a given
 * geo, and then sort depending on `isDescending`.
 */
function _getNValues(
  totals: TotalForKey,
  isDescending: boolean,
  limit: number,
): $ReadOnlyArray<{ key: string, val: number }> {
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
  return limit === -1 ? maxValList : maxValList.slice(0, limit);
}

export function parseResults(
  data: $ReadOnlyArray<DataPoint>,
  totals: TotalForKey,
  numLines: number,
  isDescending: boolean = true,
): LineGraphLines {
  const truncatedData = _getNValues(totals, isDescending, numLines);

  // Here we want to store relevant lines
  const dimensionToLineMap = {};
  truncatedData.forEach(dataEntry => {
    dimensionToLineMap[dataEntry.key] = [];
  });

  // Collect lines for items identified in truncatedData
  data.forEach(dataPoint => {
    const dimension = dataPoint.key;
    if (dimension in dimensionToLineMap) {
      dimensionToLineMap[dimension].push(dataPoint);
    }
  });

  // Collect all lines
  const lineList: LineGraphLines = Object.keys(dimensionToLineMap).map(
    dimension => dimensionToLineMap[dimension],
  );

  return lineList;
}

export default function parseResultsAndApplySettings(
  data: $ReadOnlyArray<DataPoint>,
  totals: TotalForKey,
  queryResultSpec: QueryResultSpec,
): LineGraphLines {
  const controls = queryResultSpec.getVisualizationControls('TIME');
  const isDescending = controls.sortOrder() === SORT_DESCENDING;
  return parseResults(data, totals, controls.resultLimit(), isDescending);
}
