// @flow
import numeral from 'numeral';
import { quantile } from 'd3-array';

// NOTE(stephen): We sometimes are interchanging Maps with WeakMaps in
// `_cachedComputation`. A union type unfortunately does not work since there
// is a restriction on the Key type used in WeakMap that does not exist in Map
// (limiting WeakMap to only have complex key types like objects or arrays).
// This interface exposes the shared pieces of the maps that we will use without
// restricting the keys.
interface MapLike<K, V> {
  get(key: K): V | void;
  set(key: K, value: V): mixed;
}

// These are maps used to store the results of the different functions in this
// file. Every function should have an associated cache to keep our filtering
// operations efficient.
const QUANTILE_VALUES_CACHE: WeakMap<
  $ReadOnlyArray<?number>,
  Map<number, number>,
> = new WeakMap();
const AVERAGE_VALUES_CACHE: WeakMap<
  $ReadOnlyArray<?number>,
  number,
> = new WeakMap();
const SORTED_VALUES_CACHE: WeakMap<
  $ReadOnlyArray<?number>,
  Array<number>,
> = new WeakMap();

// filter out nulls and undefines from an array of maybe numbers
// and convert any non-finite numbers to 0s (e.g. NaN and Infinity)
function _keepOnlyNumbers(values: $ReadOnlyArray<?number>): Array<number> {
  return (values.filter(
    v => v !== null && v !== undefined && Number.isFinite(v),
  ): any);
}

// helper function to add caching functionality to any function
function _cachedComputation<K, V>(
  cache: MapLike<K, V>,
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
 * Round a number if necessary. For numbers less than 1, round to four decimal
 * places. For all others, round to two decimal places.
 */
export function roundValue(num: number): string {
  const numFormat = num < 1 ? '0,0.[0000]' : '0,0.[00]';
  return numeral(num).format(numFormat);
}
