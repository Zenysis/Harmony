// @flow
/* eslint-disable react/no-unused-prop-types */
import * as React from 'react';
import classNames from 'classnames';

import type { StyleObject } from 'types/jsCore';

// NOTE(pablo): <Option> intentionally has several props that it never uses.
// It is intended to be a user-friendly interface to create Dropdown options.
// <Dropdown> then takes these props and wraps them in an <OptionWrapper> which
// does more complex operations. We do not want anyone using <OptionWrapper>
// directly because then they can override other props (e.g. depth, onSelect,
// etc.) that can break things in the Dropdown.

type Props<T> = {|
  children: React.Node,

  /**
   * The value held by this option. **NOTE:** this is *not* what is rendered
   * by the option. Whatever you want to render should be passed as the Option's
   * children. The `value` is the Option's metadata, which is passed in the
   * dropdown's `onSelectionChange` callback.
   */
  value: T,

  /** Class name to attach to this div */
  className: string,

  /** Any Option with `disableSearch` will always show up in search results */
  disableSearch: boolean,

  /** The maximum number of characters to display in the option */
  maxOptionCharacterCount: number | void,

  /**
   * If search is enabled but `searchableText` is empty, then this will never
   * show up in search results.
   */
  searchableText: string,

  /** CSS styles to pass to the Option div */
  style: StyleObject | void,

  /** The class name for the `<li>` item that will wrap the Option */
  wrapperClassName: string,

  /** Make this Option unselectable */
  unselectable: boolean,
|};

/**
 * `<Dropdown.Option>` should be used in conjunction with
 * [`<Dropdown>`](#dropdown).
 *
 * Each dropdown Option will be a list item in the dropdown. The `value` prop is
 * what will get passed in the Dropdown's `onSelectionChange` event.
 *
 * @visibleName Dropdown.Option
 */
export default class Option<T> extends React.PureComponent<Props<T>> {
  static defaultProps = {
    children: null,
    className: '',
    disableSearch: false,
    maxOptionCharacterCount: undefined,
    searchableText: '',
    style: undefined,
    wrapperClassName: '',
    unselectable: false,
  };

  getTitleProp(): { title: string | void } {
    const titleDetails = {};
    if (this.shouldTrimOptionValue()) {
      titleDetails.title = this.props.searchableText;
    }
    return titleDetails;
  }

  shouldTrimOptionValue(): boolean {
    const { maxOptionCharacterCount, searchableText } = this.props;
    return (
      typeof maxOptionCharacterCount === 'number' &&
      searchableText.length > maxOptionCharacterCount
    );
  }

  renderOptionContent(): React.Node {
    const { maxOptionCharacterCount, children } = this.props;
    const ELLIPSIS_LENGTH = 4;
    let content = children;

    if (typeof content === 'string' && this.shouldTrimOptionValue()) {
      content = content
        .slice(0, ((maxOptionCharacterCount: any): number) - ELLIPSIS_LENGTH)
        .concat(' ...');
    }

    return content;
  }

  render() {
    const { className, style, value } = this.props;
    if (value === undefined) {
      throw new Error('[Option] A dropdown option cannot be undefined');
    }

    const divClassName = classNames(
      'zen-dropdown-item zen-dropdown-option',
      className,
    );

    return (
      <div className={divClassName} style={style} {...this.getTitleProp()}>
        {this.renderOptionContent()}
      </div>
    );
  }
}
