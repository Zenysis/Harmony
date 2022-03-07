// @flow

export interface TestableRule {
  /**
   * This function takes a value and an array of values and returns true
   * if this value passes whatever rule the implementing class represents.
   *
   * NOTE(pablo): try to keep this function as an O(1) operation. Any
   * computations that are O(N) should be extracted to helper functions in
   * rulesUtil.js and should use a cache so results can be memoized.
   */
  testValue(val: ?number, allValues: $ReadOnlyArray<?number>): boolean;

  /**
   * Convert this rule to a string (e.g. 'Values > 10') to be rendered in places
   * like the Map legend.
   *
   * Some rules need an `allValues` array in order to be calculated
   * (e.g. the AboveAverageRule needs all values in order to calculate the
   * average, otherwise the string cannot be rendered)
   */
  getRuleString(allValues: $ReadOnlyArray<?number>): string;
}
