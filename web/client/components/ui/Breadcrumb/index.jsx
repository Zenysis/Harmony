// @flow
import * as React from 'react';
import classNames from 'classnames';

import BreadcrumbItem from 'components/ui/Breadcrumb/BreadcrumbItem';
import BreadcrumbItemWrapper from 'components/ui/Breadcrumb/BreadcrumbItemWrapper';
import { uniqueId } from 'util/util';

type DefaultProps<T> = {
  /**
   * Gets called when the user clicks on a breadcrumb item.
   * @param {T} value The clicked breadcrumb item's value
   * @param {SyntheticEvent.div} event The click event
   */
  onItemClick:
    | ((value: T, event: SyntheticEvent<HTMLDivElement>) => void)
    | void,

  className: string,
};

type Props<T> = {
  ...DefaultProps<T>,
  children: React.ChildrenArray<React.Element<Class<BreadcrumbItem<T>>>>,
};

/**
 * A Breadcrumb component used to display BreadcrumbItem components in
 * succession.
 */
export default class Breadcrumb<T> extends React.PureComponent<Props<T>> {
  static defaultProps: DefaultProps<T> = {
    className: '',
    onItemClick: undefined,
  };

  render(): React.Element<'div'> {
    const { children, onItemClick } = this.props;
    const items = React.Children.map(children, breadcrumbItem => (
      // If the user supplied the breadcrumbItem with a key then we'll use that.
      // Otherwise, there is no way to compute a unique key given that
      // breadcrumbItem's value can be of any type, so we have to use
      // uniqueId().
      <BreadcrumbItemWrapper
        key={breadcrumbItem ? breadcrumbItem.key || uniqueId() : uniqueId()}
        onClick={onItemClick}
        className={breadcrumbItem.props.wrapperClassName}
      >
        {breadcrumbItem}
      </BreadcrumbItemWrapper>
    ));
    const className = classNames('zen-breadcrumb', this.props.className);
    return <div className={className}>{items}</div>;
  }
}

export { BreadcrumbItem };
