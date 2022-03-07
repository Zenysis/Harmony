// @flow
import * as React from 'react';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import ExpandableTagList from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock/ExpandableTagList';
import InfoTooltip from 'components/ui/InfoTooltip';
import autobind from 'decorators/autobind';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type { Customizable } from 'types/interfaces/Customizable';
import type { CustomizableTagProps } from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock/ExpandableTagList';
import type { Identifiable } from 'types/interfaces/Identifiable';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

/**
 * A SelectionBlock combines a hierarchical selector and an expandable list that
 * shows the selected items. The SelectionBlock uses two render props:
 *  - renderQueryPartSelector to render the hierarchical selector
 *  - renderCustomizableTag to render a customizable tag that opens a
 *    customization module when clicked
 */

export type CustomQueryPartSelectorProps<T> = {
  onItemSelect: (selectedItem: HierarchyItem<T>) => void,
};

export type SelectionProps<T> = {
  onSelectedItemsChanged: (Zen.Array<T>) => void,
  selectedItems: Zen.Array<T>,
};

type DefaultProps = {
  // should we open the customization module immediately when an item
  // is selected?
  customizeOnSelect: boolean,
  helpText?: string,
  testId?: string,
};

type Props<T> = {
  ...DefaultProps,
  ...SelectionProps<T>,
  ...DefaultProps,
  onRemoveTag: T => void,
  renderCustomizableTag: (props: CustomizableTagProps<T>) => React.MixedElement,
  renderCustomQueryPartSelector: (
    props: CustomQueryPartSelectorProps<T>,
  ) => React.Node,
  title: string,
};

type State<T> = {
  itemToCustomize?: T,
};

export default class SelectionBlock<
  T: NamedItem & Identifiable & Customizable<$AllowAny>,
> extends React.PureComponent<Props<T>, State<T>> {
  static defaultProps: DefaultProps = {
    customizeOnSelect: false,
    helpText: undefined,
    testId: undefined,
  };

  state: State<T> = {
    itemToCustomize: undefined,
  };

  @autobind
  onItemSelect(item: HierarchyItem<T>) {
    const { selectedItems } = this.props;
    const selectedItem = item.metadata().customize();
    this.props.onSelectedItemsChanged(selectedItems.push(selectedItem));
    if (this.props.customizeOnSelect) {
      this.setState({ itemToCustomize: selectedItem });
    }
  }

  @autobind
  onRemoveTagClick(item: T) {
    this.props.onRemoveTag(item);
    const { selectedItems } = this.props;
    this.props.onSelectedItemsChanged(
      selectedItems.delete(selectedItems.indexOf(item)),
    );
  }

  @autobind
  onItemCustomized(item: T) {
    const { selectedItems } = this.props;
    const { itemToCustomize } = this.state;

    // NOTE(stephen): I think this would happen only during some type of race
    // condition. The itemToCustomize somehow changes while a customization
    // window is still open. The onItemCustomized callback is triggered but the
    // item is no longer selected.
    invariant(
      itemToCustomize,
      'An item customization event was received but no item is selected!',
    );

    // Swap the selected item with the new customized version.
    // NOTE(stephen): There is a potentially really annoying issue lurking here
    // based on the order that setState / onSelectedItemsChanged is called, and
    // when new props/state flushes. If you are in the process of customizing an
    // item, it is possible that the customization module will be "swapped"
    // behind the scenes. This is ok if you are using a dropdown, but it is
    // really annoying if you are typing a new label.
    this.setState({ itemToCustomize: item });
    this.props.onSelectedItemsChanged(
      selectedItems.set(selectedItems.indexOf(itemToCustomize), item),
    );
  }

  @autobind
  onSelectItemToCustomize(item?: T) {
    this.setState({ itemToCustomize: item });
  }

  maybeRenderHelpText(): React.Element<typeof InfoTooltip> | null {
    const { helpText } = this.props;
    if (helpText) {
      return <InfoTooltip text={helpText} />;
    }
    return null;
  }

  renderTitle(): React.Element<'div'> {
    return (
      <div className="selection-block__title-block">
        <div className="selection-block__title-block--title">
          {this.props.title}
        </div>
        {this.maybeRenderHelpText()}
      </div>
    );
  }

  renderExpandableTagList(): React.Element<typeof ExpandableTagList> {
    const {
      selectedItems,
      onSelectedItemsChanged,
      renderCustomizableTag,
    } = this.props;
    return (
      <ExpandableTagList
        items={selectedItems}
        itemToCustomize={this.state.itemToCustomize}
        onItemCustomized={this.onItemCustomized}
        onItemOrderChanged={onSelectedItemsChanged}
        onSelectItemToCustomize={this.onSelectItemToCustomize}
        onRemoveTagClick={this.onRemoveTagClick}
        renderCustomizableTag={renderCustomizableTag}
      />
    );
  }

  render(): React.Element<'div'> {
    const queryPartSelectorProps = { onItemSelect: this.onItemSelect };
    return (
      <div className="selection-block" data-testid={this.props.testId}>
        {this.renderTitle()}
        {this.renderExpandableTagList()}
        {this.props.renderCustomQueryPartSelector(queryPartSelectorProps)}
      </div>
    );
  }
}
