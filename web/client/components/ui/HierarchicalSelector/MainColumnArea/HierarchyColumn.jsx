// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import ColumnItem from 'components/ui/HierarchicalSelector/MainColumnArea/ColumnItem';
import ColumnWrapper from 'components/ui/HierarchicalSelector/MainColumnArea/ColumnWrapper';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import autobind from 'decorators/autobind';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

type DefaultProps<T> = {
  activeItem?: HierarchyItem<T>,
  height?: number,
  maxHeight?: number,
};

type Props<T> = {
  ...DefaultProps<T>,
  columnIndex: number,
  items: Zen.Array<HierarchyItem<T>>,
  onItemClick: (
    item: HierarchyItem<T>,
    colIndex: number,
    event: SyntheticEvent<HTMLElement>,
  ) => void,
  testItemSelectable: (HierarchyItem<T>) => boolean,
};

export default class HierarchyColumn<T: NamedItem> extends React.PureComponent<
  Props<T>,
> {
  static defaultProps: DefaultProps<T> = {
    activeItem: undefined,
    height: undefined,
    maxHeight: undefined,
  };

  @autobind
  onItemClick(
    hierarchyItem: HierarchyItem<T>,
    event: SyntheticEvent<HTMLElement>,
  ) {
    this.props.onItemClick(hierarchyItem, this.props.columnIndex, event);
  }

  render(): React.Node {
    const {
      activeItem,
      height,
      items,
      maxHeight,
      testItemSelectable,
    } = this.props;
    const columnItems = items.map(item => (
      <ColumnItem
        key={item.id()}
        hierarchyItem={item}
        isActive={activeItem === item}
        isUnselectable={!testItemSelectable(item)}
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
