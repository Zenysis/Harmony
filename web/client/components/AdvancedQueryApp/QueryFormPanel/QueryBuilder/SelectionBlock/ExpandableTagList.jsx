// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import AnimateHeight from 'components/ui/AnimateHeight';
import CustomizableTag from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock/CustomizableTag';
import DraggableItemList from 'components/ui/DraggableItemList';
import autobind from 'decorators/autobind';
import type { Identifiable } from 'types/interfaces/Identifiable';

export type CustomizableTagProps<T: Identifiable> = {
  item: T,
  onItemCustomized: (newItem: T) => void,
  onRemoveTagClick: (item: T) => void,
  onRequestCloseCustomizationModule: () => void,
  onTagClick: (item: T) => void,
  showCustomizationModule: boolean,
};

type Props<T> = {
  items: Zen.Array<T>,
  onItemCustomized: (item: T) => void,
  onItemOrderChanged: (Zen.Array<T>) => void,
  onRemoveTagClick: (value: T) => void,
  onSelectItemToCustomize: (item?: T) => void,
  renderCustomizableTag: (props: CustomizableTagProps<T>) => React.MixedElement,

  itemToCustomize?: T,
};

export default class ExpandableTagList<
  T: Identifiable,
> extends React.PureComponent<Props<T>> {
  @autobind
  onSelectItemToCustomize(item: T) {
    if (this.props.itemToCustomize === item) {
      this.onCloseCustomizationModuleClick();
    } else {
      this.props.onSelectItemToCustomize(item);
    }
  }

  @autobind
  onCloseCustomizationModuleClick() {
    this.props.onSelectItemToCustomize(undefined);
  }

  @autobind
  renderCustomizableTag(item: T): React.MixedElement {
    const {
      renderCustomizableTag,
      onRemoveTagClick,
      onItemCustomized,
      onSelectItemToCustomize,
      itemToCustomize,
    } = this.props;

    // NOTE(toshi): Checking id here due to the debouncing of indicator
    // labels, leading to unbatched setState calls, which leads to item !=
    // itemToCustomize, which would close the customization module.
    const showCustomizationModule =
      !!itemToCustomize && item.id() === itemToCustomize.id();

    return renderCustomizableTag({
      item,
      onRemoveTagClick,
      onItemCustomized,
      showCustomizationModule,
      onRequestCloseCustomizationModule: this.onCloseCustomizationModuleClick,
      onTagClick: onSelectItemToCustomize,
    });
  }

  renderTagList(): React.Node {
    return (
      <div className="expandable-tag-list__tags-container">
        <DraggableItemList
          dragRestrictionSelector={CustomizableTag.DRAG_SELECTOR}
          items={this.props.items}
          onItemOrderChanged={this.props.onItemOrderChanged}
          renderItem={this.renderCustomizableTag}
        />
      </div>
    );
  }

  render(): React.Node {
    return (
      <AnimateHeight height={this.props.items.isEmpty() ? 0 : 'auto'}>
        <div className="expandable-tag-list">{this.renderTagList()}</div>
      </AnimateHeight>
    );
  }
}
