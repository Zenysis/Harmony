// @flow

/**
 * The Identifiable interface indicates an implementing class can generate an
 * ID to represent the class instance.
 */
export interface Identifiable {
  id(): string | number;
}
