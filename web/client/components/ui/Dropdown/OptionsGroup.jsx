// @flow
/* eslint-disable react/no-unused-prop-types */
import * as React from 'react';

import type { DropdownChildType } from 'components/ui/Dropdown/types';

// NOTE(pablo): <OptionsGroup> intentionally has several props that it never
// uses. It is intended to be a user-friendly interface to create Dropdown
// option groups. <Dropdown> then takes these props and wraps them in an
// <OptionsGroupWrapper> which does more complex operations. We do not want
// anyone using <OptionsGroupWrapper> directly because then they can override
// other props (e.g. depth, onSelect, etc.) that can break things in the
// Dropdown.

type DefaultProps<T> = {
  /**
   * The accessibility name for this group. If none is specified, we will
   * use the group label.
   */
  ariaName: string | void,

  /** The `<Option>` components to render in this group */
  children: React.ChildrenArray<?DropdownChildType<T>>,

  /** The class name to add to this option */
  className: string,

  /**
   * If `disableSearch` is set then this group (and all children) will always
   * show up in search results.
   */
  disableSearch: boolean,

  /**
   * If search is enabled but `searchableText` is empty, then this group cannot
   * be matched against search results, but its children still can.
   */
  searchableText: string,

  /**
   * Class name for the wrapper `<li>` item this OptionsGroup item will be
   * rendered in.
   */
  wrapperClassName: string,

  /** testId used to access the element in tests */
  testId?: string,
};

type Props<T> = {
  ...DefaultProps<T>,

  /** The value to uniquely represent this group. */
  id: string,

  /** The label to render for this group */
  label: string,
};

/**
 * `<Dropdown.OptionsGroup>` should be used in conjunction with
 * [`<Dropdown>`](#dropdown).
 *
 * Each dropdown OptionsGroup will be an expandable list item in the dropdown
 * that contains other `<Option>` items. Clicking on an OptionsGroup will expand
 * the group to show the children, and it does **not** trigger an
 * `onSelectionChange` event. Only clicking on `<Option>` items triggers that
 * event.
 *
 * @visibleName Dropdown.OptionsGroup
 */
export default class OptionsGroup<T> extends React.PureComponent<Props<T>> {
  static defaultProps: DefaultProps<T> = {
    ariaName: undefined,
    children: null,
    className: '',
    disableSearch: false,
    searchableText: '',
    wrapperClassName: '',
    testId: undefined,
  };

  render(): string {
    return this.props.label;
  }
}
