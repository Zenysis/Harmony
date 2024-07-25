// @flow

/**
 * The Displayable interface indicates an implementing class has a display name
 * that can be shown to the user.
 */
export interface Displayable {
  displayValue(): string;
}
