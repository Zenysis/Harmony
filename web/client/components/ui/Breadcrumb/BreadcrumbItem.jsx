// @flow
/* eslint-disable react/no-unused-prop-types */
import * as React from 'react';
import classNames from 'classnames';

// NOTE(pablo): <BreadcrumbItem> intentionally has props that it never
// uses (e.g. value).
// The <Breadcrumb> component takes these props and wraps them in a
// <BreadcrumbItemWrapper> which does more complex operations. But we do not
// want anyone using <BreadcrumbItemWrapper> directly because then
// they can override other props (e.g. onClick) which might break things in
// the Breadcrumb component.
type Props<T> = {|
  children: React.Node,
  value: T,

  className: string,

  /** Class name for this item's wrapper */
  wrapperClassName: string,
|};

/**
 * `<BreadcrumbItem>` must be used in conjunction with
 * [`<Breadcrumb>`](#breadcrumb).
 *
 * Use this component to specify the value that will be passed in Breadcrumb's
 * `onItemClick` event handler.
 */
export default class BreadcrumbItem<T> extends React.PureComponent<Props<T>> {
  static defaultProps = {
    className: '',
    wrapperClassName: '',
  };

  render() {
    const { value, children } = this.props;
    if (value === undefined || value === null) {
      throw new Error(
        '[BreadcrumbItem] A breadcrumb item must specify a value',
      );
    }

    const className = classNames('zen-breadcrumb-item', this.props.className);
    return <div className={className}>{children}</div>;
  }
}
