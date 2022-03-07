// @flow
import Moment from 'models/core/wip/DateTime/Moment';

/**
 * Function that takes two arrays and adds them together as vectors, element by
 * element.
 */
export function addArrays(
  ar1: $ReadOnlyArray<number>,
  ar2: $ReadOnlyArray<number>,
): $ReadOnlyArray<number> {
  if (ar1.length !== ar2.length) {
    throw new Error('[util] Arrays must be of equal length');
  }
  return ar1.map((a, i) => a + ar2[i]);
}

/**
 * Function that takes two arrays as vectors, and subtracts the second from the
 * first, element by element.
 */
export function subtractArrays(
  ar1: $ReadOnlyArray<number>,
  ar2: $ReadOnlyArray<number>,
): $ReadOnlyArray<number> {
  if (ar1.length !== ar2.length) {
    throw new Error('[util] Arrays must be of equal length');
  }
  return ar1.map((a, i) => a - ar2[i]);
}

/**
 * Similar to the python range function, create an array between two integers
 * [start, end). (includes start, excludes end)
 * If only a single argument is passed, this argument is used as the end, and
 * start is 0.
 * Example:
 *   range(5): [0, 1, 2, 3, 4]
 *   range(1, 6): [1, 2, 3, 4, 5]
 */
export function range(start: number, end?: number): Array<number> {
  const newStart = !end ? 0 : start;
  const newEnd = !end ? start : end;

  if (newStart < 0 || newEnd < 0 || newEnd < newStart) {
    throw new Error('[util] Invalid start and end range');
  }

  const numbers = [];
  for (let i = newStart; i < newEnd; i++) {
    numbers.push(i);
  }
  return numbers;
}

/**
 * Checks if two arrays are equal, uses a hashFunc to transform an array item
 * into a value comparable with ===. The array items must be in the same order
 * in both arrays for this to return true.
 *  E.g.:
 *  arrayEquality([1, 3, 2], [1, 2, 3], (i) => i) -> returns false,
 *  arrayEquality(
 *    [{key: 'a', content: 'aaa'}, {key: 'b', content: 'bbb'}],
 *    [{key: 'a', content: 'aaaaa'}, {key: 'b', content: 'bbbbbb'}, ],
 *    (obj) => obj.key
 *  ) -> returns true
 *    Our hash function makes items comparable only by their 'key', so in this
 *    case the arrays are equal.
 */
export function arrayEquality<T>(
  arr1: $ReadOnlyArray<T>,
  arr2: $ReadOnlyArray<T>,
  hashFunc?: T => mixed = x => x,
): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }

  return arr1.every(
    (element, index) => hashFunc(element) === hashFunc(arr2[index]),
  );
}

/**
 * Helper function to sort any values just on the basis of whether or not
 * they are null or undefined. Null/undefined values will get sorted to
 * the end.
 *
 * NOTE(pablo): the order of `null` and `undefined` is not deterministic
 * and they are treated equally. This means that multiple calls
 * to this method can result in different array sorts. i.e.
 *   [100, undefined, null] and then [100, null, undefined]
 * If this becomes a problem then this function should be reworked to
 * explicitly choose an order for null and undefined.
 */
export function sortNullOrUndefined(
  a: mixed,
  b: mixed,
  reverse?: boolean = false,
): number {
  // NOTE(pablo): intentionally using == instead of === to simplify the
  // conditions here by coercing `undefined` and `null` to be the same
  if (a == null || b == null) {
    if (a == null && b != null) {
      return reverse ? 1 : -1;
    }
    if (a != null && b == null) {
      return reverse ? -1 : 1;
    }
  }

  return 0;
}

/**
 * A helper function for sorting an array of numbers. It will return a positive
 * if number a should be after b and a negative if b should be after a.
 *
 * a and b can be null or undefined, and any null or undefined values get sorted
 * to the end.
 */
export function sortNumeric(
  a: ?number,
  b: ?number,
  reverse?: boolean = false,
): number {
  if (a === null || a === undefined || b === null || b === undefined) {
    // intentionally not passing a `reverse` parameter here because
    // null/undefined should always get sorted to the end in this case
    return sortNullOrUndefined(a, b);
  }

  // TODO(stephen): Find out if we can switch this to Number.isFinite
  /* eslint-disable no-restricted-globals */
  const aIsFinite = isFinite(a);
  const bIsFinite = isFinite(b);
  /* eslint-enable no-restricted-globals */

  if (!aIsFinite && !bIsFinite) {
    return 0;
  }
  if (!aIsFinite) {
    return 1;
  }
  if (!bIsFinite) {
    return -1;
  }

  if (reverse) {
    return b - a;
  }
  return a - b;
}

/**
 * A helper function for sorting an array of strings. It will return a positive
 * if string a should be after b and a negative if b should be after a.
 */
export function sortAlphabetic(
  str1: string,
  str2: string,
  reverse?: boolean = false,
): number {
  const result = str1.localeCompare(str2);
  return reverse ? result * -1 : result;
}

export function sortDate(
  date1: Moment | moment$Moment,
  date2: Moment | moment$Moment,
  reverse?: boolean = false,
): number {
  const reversalMultiplier = reverse ? -1 : 1;
  const moment1 = date1 instanceof Moment ? date1.momentView() : date1;
  const moment2 = date2 instanceof Moment ? date2.momentView() : date2;

  // handle the cases where the moments are invalid
  if (!moment1.isValid() && moment2.isValid()) {
    return -1 * reversalMultiplier;
  }
  if (moment1.isValid() && !moment2.isValid()) {
    return 1 * reversalMultiplier;
  }
  if (!moment1.isValid() && !moment2.isValid()) {
    return 0;
  }

  if (moment1.isAfter(moment2)) {
    return 1 * reversalMultiplier;
  }
  if (moment1.isBefore(moment2)) {
    return -1 * reversalMultiplier;
  }
  return 0;
}

/**
 * Takes an input array and divides it into two output arrays based on a given
 * filter function. The first output array contains all the elements that
 * satisfy the filter. The second contains all those that do not.
 */
export function partition<T>(
  array: $ReadOnlyArray<T>,
  filter: T => boolean,
): [$ReadOnlyArray<T>, $ReadOnlyArray<T>] {
  const pass = [];
  const fail = [];
  array.forEach(item => {
    if (filter(item)) {
      pass.push(item);
    } else {
      fail.push(item);
    }
  });
  return [pass, fail];
}
