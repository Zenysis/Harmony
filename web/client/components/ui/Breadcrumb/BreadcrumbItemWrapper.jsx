// @flow
import * as React from 'react';
import classNames from 'classnames';

import BreadcrumbItem from 'components/ui/Breadcrumb/BreadcrumbItem';
import autobind from 'decorators/autobind';

type Props<T> = {
  children: React.Element<Class<BreadcrumbItem<T>>>,
  onClick: (value: T, event: SyntheticEvent<HTMLDivElement>) => void,

  className: string,
};

/**
 * BreadcrumbItemWrapper wraps a BreadcrumbItem and is used to provide
 * functionality to the Breadcrumb component that cannot be included in
 * BreadcrumbItem, otherwise users might accidentally break things if they
 * supply some props incorrectly.
 */
export default class BreadcrumbItemWrapper<T> extends React.PureComponent<
  Props<T>,
> {
  static defaultProps = {
    className: '',
  };

  @autobind
  onClick(event: SyntheticEvent<HTMLDivElement>) {
    const { children, onClick } = this.props;
    const child = React.Children.only(children);
    onClick(child.props.value, event);
  }

  render() {
    const { children } = this.props;
    const className = classNames(
      'zen-breadcrumb-item-wrapper',
      this.props.className,
    );

    return (
      <div role="button" className={className} onClick={this.onClick}>
        {children}
      </div>
    );
  }
}
