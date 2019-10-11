// @flow
import numeral from 'numeral';
import { quantile } from 'd3-array';

// These are maps used to store the results of the different functions in this
// file. Every function should have an associated cache to keep our filtering
// operations efficient.
const QUANTILE_VALUES_CACHE: Map<
  $ReadOnlyArray<?number>,
  Map<number, number>,
> = new Map();
const AVERAGE_VALUES_CACHE: Map<$ReadOnlyArray<?number>, number> = new Map();
const SORTED_VALUES_CACHE: Map<
  $ReadOnlyArray<?number>,
  Array<number>,
> = new Map();

// filter out nulls and undefines from an array of maybe numbers
// and convert any non-finite numbers to 0s (e.g. NaN and Infinity)
function _keepOnlyNumbers(values: $ReadOnlyArray<?number>): Array<number> {
  return (values.filter(
    v => v !== null && v !== undefined && Number.isFinite(v),
  ): any);
}

// helper function to add caching functionality to any function
function _cachedComputation<K, V>(
  cache: Map<K, V>,
  computationFunc: K => V,
): K => V {
  return (key: K) => {
    const cachedValue = cache.get(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    const computedVal = computationFunc(key);
    cache.set(key, computedVal);
    return computedVal;
  };
}

/**
 * Filter out the nulls in an array of numbers and then sort ascending.
 */
export const sortValuesAsc: (
  $ReadOnlyArray<?number>,
) => Array<number> = _cachedComputation(SORTED_VALUES_CACHE, values =>
  _keepOnlyNumbers(values).sort((a, b) => a - b),
);

/**
 * Calculate the average of an array of numbers that might have nulls.
 */
export const getAverage: (
  $ReadOnlyArray<?number>,
) => number = _cachedComputation(AVERAGE_VALUES_CACHE, values => {
  const sum = values.reduce(
    (currSum, x) => (x === null || x === undefined ? currSum : currSum + x),
    0,
  );
  return sum / values.length;
});

/**
 * Compute the quantile value for an array of numbers at a given percentile.
 * We use a nested cache so we don't have to constantly recompute all the
 * quantile values for each array that is passed.
 */
export function getQuantile(
  values: $ReadOnlyArray<?number>,
  percentile: number,
): number {
  const quantileCache: Map<number, number> = _cachedComputation(
    QUANTILE_VALUES_CACHE,
    () => new Map(),
  )(values);

  const quantileFunc = _cachedComputation(quantileCache, p =>
    quantile(_keepOnlyNumbers(sortValuesAsc(values)), p),
  );
  return quantileFunc(percentile);
}

/**
 * Format a number to two decimal places only if necessary
 */
export function twoDecimalPlaces(num: number): string {
  return numeral(num).format('0,0.[00]');
}
