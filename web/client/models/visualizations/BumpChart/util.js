// @flow
import BumpChartSettings from 'models/visualizations/BumpChart/BumpChartSettings';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type {
  DataPoint,
  LineData,
  MutableDataPoint,
} from 'components/ui/visualizations/BumpChart/types';
import type {
  RawTimestamp,
  SerializedDataPoint,
} from 'models/visualizations/BumpChart/types';

export function getControls(resultSpec: QueryResultSpec): BumpChartSettings {
  return resultSpec.getVisualizationControls('BUMP_CHART');
}

/**
 * Sort two line's data points for the same timestamp from largest to smallest
 * value. This sort is stable, so if the two data points have the same value,
 * the previous date's value for the same lines is used. A stable sort is very
 * helpful when large amounts of lines have the same data value. Without a
 * stable sort, the lines could oscillate at random despite having essentially
 * the same ranking.
 */
function _sortValues(
  a: DataPoint,
  b: DataPoint,
  aValues: LineData,
  bValues: LineData,
  sortDescending: boolean,
): number {
  // Compare the data point values first and return if they are different.
  const diff = b.val - a.val;
  if (diff !== 0) {
    // NOTE(stephen): Sort descending only applies when we don't have a tie.
    return sortDescending ? diff : -diff;
  }

  // If the values are the same, attempt to use the previous date bucket's value
  // for comparison. If no previous values exist, sort alphabetically based on
  // the two data point's keys.
  if (!aValues.length && !bValues.length) {
    return a.key < b.key ? -1 : 1;
  }

  const prevA = aValues[aValues.length - 1];
  const prevB = bValues[bValues.length - 1];
  if (!prevA) {
    return 1;
  }

  if (!prevB) {
    return -1;
  }

  if (prevA.timestamp === prevB.timestamp) {
    return prevA.rank - prevB.rank;
  }

  // Fall back to comparing the timestamp of the previous points.
  return prevA.timestamp > prevB.timestamp ? -1 : 1;
}

/**
 * Parse the serialized query result into an array of ranked lines.
 */
// eslint-disable-next-line import/prefer-default-export
export function parseQueryResult(
  data: $ReadOnlyArray<SerializedDataPoint>,
  dates: $ReadOnlyArray<RawTimestamp>,
  fieldId: string,
  maxLines: number,
  sortDescending: boolean,
): $ReadOnlyArray<LineData> {
  // Extract the values for the first date in the dataset. Find the top X keys
  // in the first bucket since that is the start of the graph.
  const offset = sortDescending ? 1 : -1;
  const firstBucketData = data
    .filter(d => d.timestamp === dates[0])
    .sort((a, b) => (b[fieldId] - a[fieldId]) * offset)
    .slice(0, maxLines);

  // Build a separate list for each key containing the points of the line.
  // Initialize to an empty list since this will be built up later once the
  // rank is computed.
  const valuesByKey: { [string]: Array<MutableDataPoint>, ... } = {};
  firstBucketData.forEach(d => {
    valuesByKey[d.key] = [];
  });

  // Bucket all the values by timestamp so that we can compute relative rank
  // for a given timestamp.
  const valuesByTimestamp: {
    [RawTimestamp]: Array<MutableDataPoint>,
    ...,
  } = {};
  dates.forEach(timestamp => {
    valuesByTimestamp[timestamp] = [];
  });
  data.forEach(d => {
    const { key, timestamp } = d;
    if (!valuesByKey[key]) {
      return;
    }

    // HACK(stephen): This is a short label used by the y-axis. Figure out
    // a better way to do this.
    const label = d.key.split(',')[0];

    valuesByTimestamp[timestamp].push({
      key,
      label,
      rank: -1,
      timestamp,
      val: d[fieldId] || 0,
    });
  });

  // Create an array of data points for each key which will represent the line
  // to be graphed. Attach the relative ranking of that line's value for each
  // timestamp (bucket).
  dates.forEach(timestamp => {
    const values = valuesByTimestamp[timestamp];
    // Sort largest to smallest.
    values.sort((a, b) =>
      _sortValues(a, b, valuesByKey[a.key], valuesByKey[b.key], sortDescending),
    );

    values.forEach((d, i) => {
      // Attach the rank for this datapoint.
      // eslint-disable-next-line no-param-reassign
      d.rank = i;

      // Store the full data point for this key.
      valuesByKey[d.key].push(d);
    });
  });

  const output: Array<LineData> = (Object.values(valuesByKey): any);

  // Sort the output lines from lowest rank to highest rank. This ensures the
  // axis order of lines will match the ranked first date bucket order.
  output.sort((a, b) => a[0].rank - b[0].rank);
  return output;
}
