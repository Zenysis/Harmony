// @flow
import * as React from 'react';
import classNames from 'classnames';

import BreadcrumbItem from 'components/ui/Breadcrumb/BreadcrumbItem';
import autobind from 'decorators/autobind';

type DefaultProps<T> = {
  className: string,
  onClick: ((value: T, event: SyntheticEvent<HTMLDivElement>) => void) | void,
};

type Props<T> = {
  ...DefaultProps<T>,
  children: React.Element<Class<BreadcrumbItem<T>>>,
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
  static defaultProps: DefaultProps<T> = {
    className: '',
    onClick: undefined,
  };

  @autobind
  onClick(event: SyntheticEvent<HTMLDivElement>) {
    const { children, onClick } = this.props;
    if (onClick !== undefined) {
      const child = React.Children.only(children);
      onClick(child.props.value, event);
    }
  }

  render(): React.Element<'div'> {
    const { children, onClick } = this.props;
    const className = classNames(
      'zen-breadcrumb-item-wrapper',
      this.props.className,
    );

    if (onClick === undefined) {
      return <div className={className}>{children}</div>;
    }

    return (
      <div onClick={this.onClick} role="button" className={className}>
        {children}
      </div>
    );
  }
}
