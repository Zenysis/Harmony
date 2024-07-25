// @flow
import { TIMESTAMP_GROUPING_ID } from 'models/core/QueryResultSpec/QueryResultGrouping';
import { mixedValueSort } from 'components/ui/visualizations/Table/sorting';
import type { DataPoint } from 'components/ui/visualizations/BarGraph/types';

type Comparator = (a: DataPoint, b: DataPoint) => number;

const INT_VALUE_TEST = new RegExp('^[ ]*[0-9]+[ ]*$');

/**
 * If the number range is valid, pack it into a single number that can be sorted
 * correctly alongside other number ranges. For example, range 10 - 15 will be
 * represented as 10.15. Range 25 - 99 will be represented as 25.99.
 * If the range is not valid, return `undefined`.
 */
function _packNumberRange(
  rangeStart: string | number,
  rangeEnd: string | number,
): number | void {
  if (
    (typeof rangeStart === 'string' && !INT_VALUE_TEST.test(rangeStart)) ||
    (typeof rangeEnd === 'string' && !INT_VALUE_TEST.test(rangeEnd))
  ) {
    // this is not a valid age range
    return undefined;
  }

  const start = Number(rangeStart);
  const end = Number(rangeEnd);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return undefined;
  }
  return start + end / 100;
}

/**
 * If the input value is a number range, return a numeric value that will
 * ensure the range can be sorted in ascending order. If the input is not an
 * age range, return `undefined`.
 *
 * @param {?string} value The number range represented as a string. The following
 * formats are supported (spaces are optional):
 *   - `< X`: number less than X
 *   - `> X`: number greater than X
 *   - `X+`: number greater than or equal to X
 *   - `X - Y`: age between X and Y inclusive
 * @return {number | void} the numeric value representing this range, or undefined
 * if we could not detect a valid range.
 */
function _buildNumericRangeSortValue(value: ?string): number | void {
  if (value === null || value === undefined) {
    return undefined;
  }

  // handle age `< X` option
  if (value.startsWith('<')) {
    return _packNumberRange(0, value.substr(1));
  }

  // handle age `> X` option
  if (value.startsWith('>')) {
    return _packNumberRange(value.substr(1), 99);
  }

  // handle age `X+` option
  if (value.trim().endsWith('+')) {
    return _packNumberRange(value.replace('+', ''), 99);
  }

  // handle age `X - Y` option
  if ((value.match(/-/g) || []).length === 1) {
    const [start, end] = value.split('-');
    return _packNumberRange(start, end);
  }

  // No other valid age range patterns left
  return undefined;
}

/**
 * Check if all the given values are numeric ranges (or null)
 * @param {$ReadOnlyArray<null | string>} values The values we are testing
 * @returns boolean
 */
function _checkIfAllValuesAreNumberRanges(
  values: $ReadOnlyArray<null | string>,
): boolean {
  return values.every(
    v => v === null || _buildNumericRangeSortValue(v) !== undefined,
  );
}

/**
 * Create a comparator to sort an array of dimension values alphabetically.
 * It includes a special case for when the dimension values are numeric ranges
 * (e.g. age ranges: < 10, 10-15, 20+)
 *
 * @param {$ReadOnlyArray<null | string>} dimensionValues The dimension values
 * we want to alphabetically sort.
 * @param {string} dimensionId The dimension id that represents the dimensionValues
 * @param {boolean} descending Whether or not to sort in descending order
 * @returns {Comparator} A function that compares bar graph DataPoint types
 *
 */
export default function buildAlphabeticalDimensionSortComparator(
  dimensionValues: $ReadOnlyArray<null | string>,
  dimensionId: string,
  descending: boolean,
): Comparator {
  // first we need to check if all values are numeric ranges, because
  // that's a special case
  if (
    dimensionId !== TIMESTAMP_GROUPING_ID &&
    _checkIfAllValuesAreNumberRanges(dimensionValues)
  ) {
    // convert all ranges to sortable numbers
    const rangesMap: Map<string | null, number | void> = dimensionValues.reduce(
      (map, val) => map.set(val, _buildNumericRangeSortValue(val)),
      new Map(),
    );

    return (a: DataPoint, b: DataPoint) =>
      mixedValueSort(
        rangesMap.get(a.dimensions[dimensionId]),
        rangesMap.get(b.dimensions[dimensionId]),
        descending,
      );
  }

  return (a: DataPoint, b: DataPoint) =>
    mixedValueSort(
      a.dimensions[dimensionId],
      b.dimensions[dimensionId],
      descending,
    );
}
