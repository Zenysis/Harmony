// @flow
import * as React from 'react';
import classNames from 'classnames';

import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import autobind from 'decorators/autobind';

type Props = {
  hierarchyItem: HierarchyItem,
  onClick: (item: HierarchyItem, event: SyntheticEvent<HTMLElement>) => void,

  isActive: boolean,
};

export default class ColumnItem extends React.PureComponent<Props> {
  static defaultProps = {
    isActive: false,
  };

  @autobind
  onClick(event: SyntheticEvent<HTMLElement>) {
    this.props.onClick(this.props.hierarchyItem, event);
  }

  maybeRenderAngleIcon() {
    const { hierarchyItem } = this.props;
    if (hierarchyItem.isCategoryItem()) {
      const className = classNames(
        'hierarchy-column-item__angle-icon',
        'glyphicon glyphicon-menu-right',
      );
      return <i className={className} />;
    }
    return null;
  }

  render() {
    const { isActive, hierarchyItem } = this.props;
    const className = classNames('hierarchy-column-item', {
      'hierarchy-column-item--active': isActive,
    });
    const labelClassName = classNames('hierarchy-column-item__label', {
      'hierarchy-column-item__label--leaf': hierarchyItem.isLeafItem(),
    });

    return (
      <div
        title={hierarchyItem.name()}
        role="menuitem"
        className={className}
        onClick={this.onClick}
      >
        <span className={labelClassName}>{hierarchyItem.shortName()}</span>
        {this.maybeRenderAngleIcon()}
      </div>
    );
  }
}
