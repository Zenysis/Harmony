// @flow
import * as React from 'react';
import classNames from 'classnames';

import * as Zen from 'lib/Zen';
import Breadcrumb, { BreadcrumbItem } from 'components/ui/Breadcrumb';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import autobind from 'decorators/autobind';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

type DefaultProps = {
  className: string,

  /** Hide the root element of the path */
  hideRoot: boolean,
};

type Props<T> = {
  ...DefaultProps,
  onCategoryClick: (path: Zen.Array<HierarchyItem<T>>) => void,
  path: Zen.Array<HierarchyItem<T>>,
};

const HOME_ICON = <span className="glyphicon glyphicon-home" />;

export default class SearchPath<T: NamedItem> extends React.PureComponent<
  Props<T>,
> {
  static defaultProps: DefaultProps = {
    className: '',
    hideRoot: false,
  };

  @autobind
  onCategoryClick(item: HierarchyItem<T>) {
    const { onCategoryClick, path } = this.props;
    const idx = path.indexOf(item);
    onCategoryClick(path.slice(0, idx + 1));
  }

  render(): React.Element<'div'> | null {
    const { path, className, hideRoot } = this.props;
    if (path.isEmpty()) {
      return null;
    }

    const newPath = hideRoot ? path.tail() : path;
    const items = newPath.mapValues(item => {
      const content = item.isHierarchyRoot() ? HOME_ICON : item.shortName();
      return (
        <BreadcrumbItem key={item.id()} value={item}>
          {content}
        </BreadcrumbItem>
      );
    });

    const mainClassName = classNames('hierarchical-search-path', className);
    return (
      <div className={mainClassName}>
        <Breadcrumb
          className="hierarchical-search-path__breadcrumb"
          onItemClick={this.onCategoryClick}
        >
          {items}
        </Breadcrumb>
      </div>
    );
  }
}
