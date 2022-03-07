// @flow
import * as React from 'react';

// NOTE(pablo): <RadioItem> intentionally has several props that it never uses.
// It is intended as a user-friendly interface to create RadioItems.
// <RadioGroup> will take these props and pass them to a <RadioItemWrapper>
// component that has a more complex interface, but this way the user never
// has to deal with the more complex RadioItemWrapper API.

export type Props<T> = {
  /**
   * The value held by this radio item. **NOTE:** this is
   * **not** what is rendered. Whatever you want to render should be passed
   * as the RadioItem's children. The `value` is the RadioItem's metadata
   * which is passed in the `onChange` callback.
   */
  value: T,
  children: React.Node,

  /**
   * The accessibility name for this option. If none is specified, we will
   * use the radio item's children if it is a string or number.
   */
  ariaName?: string | void,

  /** Class name to attach to the radio item's container */
  className?: string,

  /** Whether or not to disable this radio item */
  disabled?: boolean,

  /** The DOM id for this radio item */
  id?: string,

  /**
   * An optional name used to identify this radio item. This will override the
   * `name` prop provided in the `<RadioGroup>`. This name is different from
   * the `ariaName`, which is used for accessibility. The `name` prop is
   * passed to the `onChange` callback as an additional way to identify your
   * RadioItem or RadioGroup.
   */
  name?: string,

  /**
   * The test id to add to the radio item. This adds a `data-testid`
   * attribute and is useful for working with testing libraries.
   */
  testId?: string | void,
};

export type RadioItemElement<T> = React.Element<<T>(Props<T>) => React.Node>;

/**
 * `<RadioItem>` must be used in conjunction with [`<RadioGroup>`](#radiogroup).
 *
 * @visibleName RadioGroup.Item
 */
export default function RadioItem<T>({
  value, // eslint-disable-line no-unused-vars
  children,
  ariaName = undefined, // eslint-disable-line no-unused-vars
  className = '', // eslint-disable-line no-unused-vars
  disabled = false, // eslint-disable-line no-unused-vars
  name = undefined, // eslint-disable-line no-unused-vars
  id = undefined, // eslint-disable-line no-unused-vars
  testId = undefined, // eslint-disable-line no-unused-vars
}: Props<T>): React.Node {
  return <>{children}</>;
}
