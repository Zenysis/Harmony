// @flow
import * as React from 'react';

import ColumnItem from 'components/ui/HierarchicalSelector/MainColumnArea/ColumnItem';
import ColumnWrapper from 'components/ui/HierarchicalSelector/MainColumnArea/ColumnWrapper';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import ZenArray from 'util/ZenModel/ZenArray';
import autobind from 'decorators/autobind';

type Props = {
  columnIndex: number,
  items: ZenArray<HierarchyItem>,
  onItemClick: (
    item: HierarchyItem,
    colIndex: number,
    event: SyntheticEvent<HTMLElement>,
  ) => void,

  activeItem?: HierarchyItem,
  height?: number,
  maxHeight?: number,
};

export default class HierarchyColumn extends React.PureComponent<Props> {
  static defaultProps = {
    activeItem: undefined,
    height: undefined,
    maxHeight: undefined,
  };

  @autobind
  onItemClick(
    hierarchyItem: HierarchyItem,
    event: SyntheticEvent<HTMLElement>,
  ) {
    this.props.onItemClick(hierarchyItem, this.props.columnIndex, event);
  }

  render() {
    const { height, maxHeight, items, activeItem } = this.props;
    const columnItems = items.map(item => (
      <ColumnItem
        key={item.id()}
        isActive={activeItem === item}
        hierarchyItem={item}
        onClick={this.onItemClick}
      />
    ));

    return (
      <ColumnWrapper height={height} maxHeight={maxHeight}>
        {columnItems}
      </ColumnWrapper>
    );
  }
}
