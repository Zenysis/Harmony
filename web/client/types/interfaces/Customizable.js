// @flow

/**
 * The Customizable interface indicates an implementing class can be cloned and
 * produce a new instance that can be customized.
 */
export interface Customizable<+T> {
  customize(): T;
}
