// @flow
import {
  sortAlphabetic,
  sortNumeric,
  sortNullOrUndefined,
} from 'util/arrayUtil';
import type { DataFrame } from 'models/core/Field/CustomField/Formula/types';

// keep a cache of all sorted dataframes. This maps a source data frame
// to a cache of all ways it has been sorted
const DATAFRAME_CACHE: WeakMap<
  DataFrame,
  Map<
    string,
    {
      sortedDataFrame: DataFrame,
      // when we sort a dataframe, we also need to store an array of
      // how the indices have changed. This is necessary so that we
      // can map results back to their original idx in the unsorted
      // dataframe. For example, an array here might be:
      //     [0, 1, 90, 3, ...]
      // This tells us that, after sorting, the 3rd item actually
      // corresponds to the 90th idx in the originl dataframe.
      sortedIdxOrder: $ReadOnlyArray<number>,
    },
  >,
> = new WeakMap();

function hashSortKeys(
  sortOn: $ReadOnlyArray<{ dimension: string, direction: 'ASC' | 'DESC' }>,
): string {
  return sortOn.map(sort => `${sort.dimension}_${sort.direction}`).join('__');
}

/**
 * Custom calculations need to run on a sorted dataframe for certain
 * calculations to make sense (e.g. cumulative sum across dates).
 * However, we can't modify the original dataframe. So we need to produce
 * a new sorted dataframe, but also keep track of how the indices have
 * changed after sorting. This `sortedIdxOrder` is used to map the results
 * of a custom calculation back to their original index in the unsorted
 * dataframe.
 *
 * As a performance optimization, we use a Map cache to prevent having
 * to sort dataframes over and over again on each calculation.
 */
export default function sortDataFrame(
  dataframe: DataFrame,
  sortOn: $ReadOnlyArray<{
    dimension: string,
    direction: 'ASC' | 'DESC',
  }>,
): { sortedDataFrame: DataFrame, sortedIdxOrder: $ReadOnlyArray<number> } {
  if (!DATAFRAME_CACHE.has(dataframe)) {
    DATAFRAME_CACHE.set(dataframe, new Map());
  }
  const cache = DATAFRAME_CACHE.get(dataframe) || new Map();
  const sortKeyHash = hashSortKeys(sortOn);
  const cachedDataFrame = cache.get(sortKeyHash);
  if (cachedDataFrame) {
    return cachedDataFrame;
  }

  const clonedRowTuples = dataframe.rows.map((row, i) => ({
    row,
    originalIndex: i,
  }));

  clonedRowTuples.sort(({ row: row1 }, { row: row2 }) => {
    // intentionally using a `for` loop so we can break out of it
    for (let i = 0; i < sortOn.length; i++) {
      const { dimension, direction } = sortOn[i];
      const val1 = row1[dimension];
      const val2 = row2[dimension];

      if (val1 === undefined || val2 === undefined) {
        const sortResult = sortNullOrUndefined(
          val1,
          val2,
          direction === 'DESC',
        );
        if (sortResult !== 0) {
          return sortResult;
        }
      } else {
        let sortResult = 0;
        if (typeof val1 === 'number' && typeof val2 === 'number') {
          sortResult = sortNumeric(val1, val2);
        } else if (typeof val1 === 'string' && typeof val2 === 'string') {
          sortResult = sortAlphabetic(val1, val2);
        }

        if (sortResult !== 0) {
          return direction === 'ASC' ? sortResult : -1 * sortResult;
        }
      }
    }

    return 0;
  });

  const newValues = {};
  Object.keys(dataframe.values).forEach(fieldId => {
    newValues[fieldId] = clonedRowTuples.map(tuple => tuple.row[fieldId]);
  });

  const sortedDataFrame = {
    rows: clonedRowTuples.map(tuple => tuple.row),
    values: newValues,
  };

  const sortInfo = {
    sortedDataFrame,
    sortedIdxOrder: clonedRowTuples.map(tuple => tuple.originalIndex),
  };

  cache.set(sortKeyHash, sortInfo);
  return sortInfo;
}
