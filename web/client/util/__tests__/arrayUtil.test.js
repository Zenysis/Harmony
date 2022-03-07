// @flow
import {
  addArrays,
  arrayEquality,
  subtractArrays,
  partition,
  range,
  sortAlphabetic,
  sortNumeric,
} from 'util/arrayUtil';

describe('arrayUtil', () => {
  test('`addArrays` correctly adds two arrays', () => {
    const arrayA = [-1, 2, -2, 1.5, 0];
    const arrayB = [3, 4.5, 1, 1.25, 3];
    const expectedResult = [2, 6.5, -1, 2.75, 3];
    expect(addArrays(arrayA, arrayB)).toEqual(expectedResult);
  });

  test('`addArrays` throws error adds for unequal length arrays', () => {
    const arrayA = [1];
    const arrayB = [1, 1];
    expect(() => addArrays(arrayA, arrayB)).toThrowError();
  });

  test('`subtractArrays` correctly subtracts two arrays', () => {
    const arrayA = [-1, 4.5, -2, 1.5, 0];
    const arrayB = [3, 2, 1, 1.25, 3];
    const expectedResult = [-4, 2.5, -3, 0.25, -3];
    expect(subtractArrays(arrayA, arrayB)).toEqual(expectedResult);
  });

  test('`subtractArrays` throws error adds for unequal length arrays', () => {
    const arrayA = [1];
    const arrayB = [1, 1];
    expect(() => subtractArrays(arrayA, arrayB)).toThrowError();
  });

  test('`range` with one argument produces a correct array', () => {
    expect(range(10)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  test('`range` with a start argument produces a correct array', () => {
    expect(range(5, 10)).toEqual([5, 6, 7, 8, 9]);
  });

  test('`range` throws an error if the start value is greater then the end value', () => {
    expect(() => range(10, 5)).toThrowError();
  });

  test('`arrayEquality` returns true for equal arrays of strings', () => {
    const arrayA = ['a', 'b'];
    const arrayB = ['a', 'b'];
    expect(arrayEquality(arrayA, arrayB)).toEqual(true);
  });

  test('`arrayEquality` returns true for unequal arrays of strings', () => {
    const arrayA = ['a', 'b'];
    const arrayB = ['a', 'c'];
    expect(arrayEquality(arrayA, arrayB)).toEqual(false);
  });

  test('`arrayEquality` returns true for equal arrays of numbers', () => {
    const arrayA = [1, 2];
    const arrayB = [1, 2];
    expect(arrayEquality(arrayA, arrayB)).toEqual(true);
  });

  test('`arrayEquality` returns false for unequal arrays of numbers', () => {
    const arrayA = [1, 2];
    const arrayB = [1, 3];
    expect(arrayEquality(arrayA, arrayB)).toEqual(false);
  });

  test('`arrayEquality` returns false for unequal length arrays', () => {
    const arrayA = [1, 2];
    const arrayB = [1, 2, 3];
    expect(arrayEquality(arrayA, arrayB)).toEqual(false);
  });

  test('`arrayEquality` works when providing a hash function resulting in equal arrays', () => {
    const arrayA = [
      { id: 1, value: 100 },
      { id: 2, value: 200 },
    ];
    const arrayB = [
      { id: 1, value: 1 },
      { id: 2, value: 2 },
    ];
    expect(arrayEquality(arrayA, arrayB, item => item.id)).toEqual(true);
  });

  test('`arrayEquality` works when providing a hash function resulting in unequal arrays', () => {
    const arrayA = [
      { id: 1, value: 100 },
      { id: 2, value: 200 },
    ];
    const arrayB = [
      { id: 1, value: 1 },
      { id: 2, value: 2 },
    ];
    expect(arrayEquality(arrayA, arrayB, item => item.value)).toEqual(false);
  });

  test('`sortNumeric` returns a positive when first value is greater then the second', () => {
    expect(sortNumeric(2, 1)).toBeGreaterThan(0);
  });

  test('`sortNumeric` returns a negative when first value is less then the second', () => {
    expect(sortNumeric(1, 2)).toBeLessThan(0);
  });

  test('`sortNumeric` returns zero when first value equals the second', () => {
    expect(sortNumeric(1, 1)).toEqual(0);
  });

  test('`sortNumeric` returns a negative when first value is greater then the second and reverse is true', () => {
    expect(sortNumeric(2, 1, true)).toBeLessThan(0);
  });

  test('`sortNumeric` returns a positive when first value is less then the second and reverse is true', () => {
    expect(sortNumeric(1, 2, true)).toBeGreaterThan(0);
  });

  test('`sortNumeric` returns 0 when first value equals the second and reverse is true', () => {
    expect(sortNumeric(1, 1, true)).toEqual(0);
  });

  test('`sortNumeric` returns a negative when first value is null', () => {
    expect(sortNumeric(null, -1)).toBeLessThan(0);
  });

  test('`sortNumeric` returns a negative when first value is undefined', () => {
    expect(sortNumeric(undefined, -1)).toBeLessThan(0);
  });

  test('`sortNumeric` returns a negative when first value is null and reverse is true', () => {
    expect(sortNumeric(null, -1, true)).toBeLessThan(0);
  });

  test('`sortNumeric` returns a negative when first value is undefined and reverse is true', () => {
    expect(sortNumeric(undefined, -1, true)).toBeLessThan(0);
  });

  test('`sortNumeric` returns a positive when second value is null', () => {
    expect(sortNumeric(-1, null)).toBeGreaterThan(0);
  });

  test('`sortNumeric` returns a positive when the second value is undefined', () => {
    expect(sortNumeric(-1, undefined)).toBeGreaterThan(0);
  });

  test('`sortNumeric` returns a positive when second value is null and reverse is true', () => {
    expect(sortNumeric(-1, null, true)).toBeGreaterThan(0);
  });

  test('`sortNumeric` returns a positive when the second value is undefined and reverse is true', () => {
    expect(sortNumeric(-1, undefined, true)).toBeGreaterThan(0);
  });

  test('`sortNumeric` returns zero when both values are null or undefined', () => {
    expect(sortNumeric(undefined, undefined)).toEqual(0);
    expect(sortNumeric(null, null)).toEqual(0);
    expect(sortNumeric(undefined, null)).toEqual(0);
  });

  test('`sortAlphabetic` returns a positive when first value is alphabetically after the second', () => {
    expect(sortAlphabetic('b', 'a')).toBeGreaterThan(0);
  });

  test('`sortAlphabetic` returns a negative when first value is alphabetically before the second', () => {
    expect(sortAlphabetic('a', 'b')).toBeLessThan(0);
  });

  test('`sortAlphabetic` returns zero when first value equals the second', () => {
    expect(sortAlphabetic('a', 'a')).toEqual(0);
  });

  test('`sortAlphabetic` returns a negative when first value is alphabetically after the second and reverse is true', () => {
    expect(sortAlphabetic('b', 'a', true)).toBeLessThan(0);
  });

  test('`sortAlphabetic` returns a positive when first value is alphabetically before the second and reverse is true', () => {
    expect(sortAlphabetic('a', 'b', true)).toBeGreaterThan(0);
  });

  test('`sortAlphabetic` returns a positive when first value is equal to the second and reverse is true', () => {
    // NOTE(david): We use === rather than jest's toEqual method to sidestep an
    // issue where jest evaluates (0).toEqual(-0) as false
    expect(sortAlphabetic('a', 'a', true) === 0).toEqual(true);
  });

  test('`partition` correctly partitions an array into two', () => {
    const array = [1, -1, 2, -2, 3, -3];
    const checkIsPositive = val => val > 0;
    const expectedPositives = [1, 2, 3];
    const expectedNegatives = [-1, -2, -3];
    expect(partition(array, checkIsPositive)).toEqual([
      expectedPositives,
      expectedNegatives,
    ]);
  });
});
