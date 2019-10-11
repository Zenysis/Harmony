// @flow
import * as React from 'react';
import classNames from 'classnames';

import Breadcrumb, { BreadcrumbItem } from 'components/ui/Breadcrumb';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import ZenArray from 'util/ZenModel/ZenArray';
import autobind from 'decorators/autobind';

type Props = {
  onCategoryClick: (path: ZenArray<HierarchyItem>) => void,
  path: ZenArray<HierarchyItem>,

  className: string,

  /** Hide the root element of the path */
  hideRoot: boolean,
};

const HOME_ICON = <span className="glyphicon glyphicon-home" />;

export default class SearchPath extends React.PureComponent<Props> {
  static defaultProps = {
    className: '',
    hideRoot: false,
  };

  @autobind
  onCategoryClick(item: HierarchyItem) {
    const { onCategoryClick, path } = this.props;
    const idx = path.indexOf(item);
    onCategoryClick(path.slice(0, idx + 1));
  }

  render() {
    const { path, className, hideRoot } = this.props;
    if (path.isEmpty()) {
      return null;
    }

    const newPath = hideRoot ? path.tail() : path;
    const items = newPath.mapValues((item) => {
      const content = item.isHierarchyRoot()
        ? HOME_ICON
        : item.shortName();
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
