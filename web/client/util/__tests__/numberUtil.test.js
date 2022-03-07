// @flow
import { round } from 'util/numberUtil';

describe('numberUtil', () => {
  test('`round` rounds to the correct number of decimal places', () => {
    expect(round(1.12, 2)).toEqual(1.12);
    expect(round(1.12, 1)).toEqual(1.1);
    expect(round(1.12, 0)).toEqual(1);
  });

  test('`round` correctly rounds boundary cases', () => {
    expect(round(1.005, 2)).toEqual(1.01);
    expect(round(1.004999999999, 2)).toEqual(1);
  });
});
