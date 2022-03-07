// @flow
import memoizeOne from 'memoize-one';

import type {
  DataFrameRow,
  Interpreter,
  InterpreterArray,
  InterpreterObject,
} from 'models/core/Field/CustomField/Formula/types';

/**
 * This file holds a collection of functions to perform common operations
 * that can be used within the JS Interpreter. These functions are intended
 * to be used within custom calculations.
 *
 * Instead of operating on native JS objects, these functions work with the
 * Interpreter's pseudo objects.
 *
 * NOTE(pablo): This file uses a lot of imperative control logic intentionally
 * for performance reasons.
 */

/**
 * A collection of values that have been detached from the global dataframe.
 * This consists of two same-length arrays. One array contains all values,
 * the other array contains the index each value had in the dataframe.
 *
 * This lets us use these values correctly in helper functions that rely on
 * the dataframe's row indices, such as movingAverage or cumulativeSum.
 */
type DetachedValuesObject = InterpreterObject<{
  values: InterpreterArray<number | null>,
  globalIndices: InterpreterArray<number>,
}>;

type NativeDetachedValuesObject = {
  values: Array<number | null>,
  globalIndices: Array<number>,
};

/**
 * Helper function to refine between an InterpreterArray or a
 * DetachedValuesObject.
 */
function _isInterpreterArray(
  arr: InterpreterArray<?(string | number)> | DetachedValuesObject,
): boolean %checks {
  return !!arr.class && arr.class === 'Array';
}

/**
 * Helper function to replicate the `indexOf` functionality but for an
 * InterpreterArray.
 */
function _findIndexInInterpreterArray(
  arr: InterpreterArray<mixed>,
  val: mixed,
): number | void {
  const { properties } = arr;
  for (let i = 0; i < properties.length; i++) {
    if (properties[i] === val) {
      return i;
    }
  }
  return undefined;
}

/**
 * A `sum` function that can work with Interpreter objects
 */
function pseudoSum(
  arr: InterpreterArray<?(string | number)> | DetachedValuesObject,
): number {
  const arrayToSum = _isInterpreterArray(arr) ? arr : arr.properties.values;
  let sum = 0;
  for (let i = 0; i < arrayToSum.properties.length; i++) {
    const val = arrayToSum.properties[i];

    // treat undefined and null as 0
    if (val !== undefined && val !== null) {
      sum += Number(val);
    }
  }
  return sum;
}

/**
 * A memoized version of the `pseudoSum` function. This function will remember
 * the last array that was passed, and if it is the same array then it returns
 * the same result instead of re-calculating.
 */
export const memoizedPseudoSum: typeof pseudoSum = memoizeOne(pseudoSum);

/**
 * A helper function to get the difference between the values at a given
 * dataframe row index, and the previous row.
 */
export function differenceFromPrevious(
  arr: InterpreterArray<?(string | number)> | DetachedValuesObject,
  dataframeRowIdx: number,
): number {
  const arrayToUse = _isInterpreterArray(arr) ? arr : arr.properties.values;
  const currIdx = _isInterpreterArray(arr)
    ? dataframeRowIdx
    : _findIndexInInterpreterArray(
        arr.properties.globalIndices,
        dataframeRowIdx,
      );

  if (currIdx !== undefined) {
    const currVal = Number(arrayToUse.properties[currIdx] || 0);
    const prevVal = Number(arrayToUse.properties[currIdx - 1] || 0);
    return currVal - prevVal;
  }

  return 0;
}

/**
 * A helper function to calculate the moving average in an array, starting from
 * `currIdx` and moving BACK in `windowSize`.
 */
export function movingAverage(
  arr: InterpreterArray<?(string | number)> | DetachedValuesObject,
  windowSize: number,
  currIdx: number,
): number {
  const arrayToAvg = _isInterpreterArray(arr) ? arr : arr.properties.values;
  const referenceIdx = _isInterpreterArray(arr)
    ? currIdx
    : _findIndexInInterpreterArray(arr.properties.globalIndices, currIdx);

  if (referenceIdx !== undefined) {
    const startIdx = Math.max(referenceIdx - windowSize + 1, 0);
    const endIdx = referenceIdx + 1;
    const length = endIdx - startIdx;
    let sum = 0;
    for (let i = startIdx; i < endIdx; i++) {
      sum += Number(arrayToAvg.properties[i] || 0) || 0;
    }
    return sum / length;
  }

  return 0;
}

/**
 * A helper function to calculate the cumulative sum in an array up to a
 * given index
 */
export function cumulativeSum(
  arr: InterpreterArray<?(string | number)> | DetachedValuesObject,
  idx: number,
): number {
  const endIdx = _isInterpreterArray(arr)
    ? idx
    : _findIndexInInterpreterArray(arr.properties.globalIndices, idx);
  const arrayToSum = _isInterpreterArray(arr) ? arr : arr.properties.values;

  if (endIdx !== undefined) {
    let sum = 0;
    for (let i = 0; i < endIdx + 1; i++) {
      const val = arrayToSum.properties[i];

      // treat undefined and null as 0
      if (val !== undefined && val !== null) {
        sum += Number(arrayToSum.properties[i]);
      }
    }
    return sum;
  }

  return 0;
}

/**
 * Group all the values in an array by a given dimension id. For example,
 * if the dimension id is 'ProvinceName', then the result might be something
 * like:
 * {
 *   Amhara: { values: [...], globalIndices: [...] },
 *   Addis: { values: [...], globalIndices: [...] },
 *   ...
 * }
 *
 * Each dimension value is mapped to a collection of 'DetachedValuesObject',
 * which consists of two arrays: one array has all the values, and the other
 * has the original index each value had in the dataframe. This lets
 * us associate values back to their location in the dataframe so we can
 * do things like 'movingAverage' and 'cumulativeSum' correctly on grouped
 * values.
 *
 * NOTE(pablo): we expect the `values` array to be passed first, separately from
 * the `dataframeRows`. The reason is because the `dataframeRows` variable can
 * be injected by us in `Formula/index.js`, so the user only has to write:
 *   `valuesByDimension(data.values.[field], 'ProvinceName')`
 */
function valuesByDimension(
  values: InterpreterArray<number | null>,
  dimensionId: string,
  dataframeRows: InterpreterArray<InterpreterObject<DataFrameRow>>,
): {
  [dimensionId: string]: NativeDetachedValuesObject,
  ...,
} {
  const results: {
    [string]: NativeDetachedValuesObject,
    ...,
  } = {};

  // collect all field values grouped by dimension val, for a given dimension id
  for (let i = 0; i < values.properties.length; i++) {
    const fieldVal = values.properties[i];
    const dimensionVal = dataframeRows.properties[i].properties[dimensionId];
    if (typeof dimensionVal === 'string') {
      if (dimensionVal in results) {
        results[dimensionVal].values.push(fieldVal);
        results[dimensionVal].globalIndices.push(i);
      } else {
        results[dimensionVal] = {
          values: [fieldVal],
          globalIndices: [i],
        };
      }
    }
  }

  return results;
}

/**
 * A memoized version of the `valuesByDimension` function. That way we
 * don't always have to recalculate the groupings.
 */
export const memoizedValuesByDimension: typeof valuesByDimension = memoizeOne(
  valuesByDimension,
);

/**
 * Given an array of values, filter it by the values that have a given
 * dimension value.
 * For example, given all values of malaria, we can filter to get only the
 * values where 'ProvinceName' is equal to 'Amhara'. This call would
 * look like this:
 *   `valuesWithDimension(data.values.[field], 'ProvinceName', ProvinceName)`
 *
 * This is typically used so users can do `sum` calculations that are grouped
 * by dimension, e.g.:
 *   `sum(valuesWithDimension(data.values.[field], 'district', district))`
 */
function valuesWithDimension(
  values: InterpreterArray<number | null>,
  dimensionId: string,
  dimensionValue: string,
  dataframeRows: InterpreterArray<InterpreterObject<DataFrameRow>>,
  interpreter: Interpreter,
): DetachedValuesObject {
  const groupedValues = memoizedValuesByDimension(
    values,
    dimensionId,
    dataframeRows,
  );

  // $FlowIssue[incompatible-return] This is safe
  // $FlowIssue[invalid-call-util] This is safe
  return interpreter.nativeToPseudo(
    groupedValues[dimensionValue] || {
      values: [],
      globalIndices: [],
    },
  );
}

/**
 * A memoized version of the `valuesWithDimension` function. That way we
 * don't always have to do the expensive `nativeToPseudo` function call.
 */
export const memoizedValuesWithDimension: typeof valuesWithDimension = memoizeOne(
  valuesWithDimension,
);
