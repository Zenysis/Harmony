// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Caret from 'components/ui/Caret';
import HierarchicalSelector from 'components/ui/HierarchicalSelector';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import Popover from 'components/ui/Popover';
import { autobind } from 'decorators';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

type DefaultProps<T> = {
  buttonClassName: string,

  /**
   * Generates the title of a column
   * @param {HierarchyItem<T>} item The HierarchyItem that produced this column
   * @returns {string} The column title
   */
  columnTitleGenerator: (HierarchyItem<T>) => string,
  columnWidth: number,

  enableSearch: boolean,

  /** Used to determine if a loading spinner should be shown. */
  hierarchyLoaded: boolean,

  /** Maximum height for the hierarchical Selector */
  maxHeight?: number,

  /** Maximum width for the hierarchical Selector */
  maxWidth: number,

  /**
   * Determines if a loading spinner is shown on the dropdown button when
   * hierarchyLoaded is False
   */
  showLoadingSpinnerOnButton: boolean,

  /**
   * A list of ids that represent items that have already been selected and
   * cannot be selected again. Unless the parent component maintains a list
   * of unselectable items, this feature will be ignored due to defaulting to
   * an empty list.
   */
  unselectableHierarchyItems: Zen.Array<string>,
};

type Props<T> = {
  ...DefaultProps<T>,

  /** Text that appears on the dropdown button when no item has been selected */
  defaultDropdownText: string,
  hierarchyRoot: HierarchyItem<T>,

  /** Callback for when an item is selected */
  onItemSelected: (item: HierarchyItem<T>) => void,

  /** Currently selected dropdown item */
  selectedItem: HierarchyItem<T> | void,
};

type State = {
  menuButtonElt: HTMLDivElement | void,
  selectorOpen: boolean,
};

/**
 * A wrapper for the hierarchical selector so that it can be used like a
 * dropdown menu to select a single item. The currently selected item is
 * controlled by the parent of this component through the selectedItem and
 * onItemSelected props.
 */
export default class HierarchicalSelectorDropdown<
  T: NamedItem,
> extends React.PureComponent<Props<T>, State> {
  static defaultProps: DefaultProps<T> = {
    buttonClassName: '',
    columnTitleGenerator: () => '',
    columnWidth: 400,
    enableSearch: false,
    hierarchyLoaded: true,
    maxHeight: undefined,
    maxWidth: 1000,
    showLoadingSpinnerOnButton: false,
    unselectableHierarchyItems: Zen.Array.create(),
  };

  state: State = {
    menuButtonElt: undefined,
    selectorOpen: false,
  };

  @autobind
  onMenuButtonClick(event: SyntheticEvent<HTMLDivElement>) {
    const menuButtonElt = event.currentTarget;
    this.setState(prevState => ({
      menuButtonElt,
      selectorOpen: !prevState.selectorOpen,
    }));
  }

  @autobind
  onHierarchyItemClicked(item: HierarchyItem<T>) {
    if (item.isLeafItem()) {
      this.setState({ selectorOpen: false }, this.props.onItemSelected(item));
    }
  }

  @autobind
  renderDropdownButton(): React.Node {
    const {
      buttonClassName,
      hierarchyLoaded,
      showLoadingSpinnerOnButton,
      selectedItem,
    } = this.props;

    let buttonContent;
    if (selectedItem) {
      buttonContent = selectedItem.name();
    } else if (!hierarchyLoaded && showLoadingSpinnerOnButton) {
      buttonContent = <LoadingSpinner />;
    } else {
      buttonContent = this.props.defaultDropdownText;
    }

    return (
      <div
        role="button"
        className={`hierarchical-selector-dropdown__button ${buttonClassName}`}
        onClick={this.onMenuButtonClick}
      >
        {buttonContent}
        <Caret className="hierarchical-selector-dropdown__button-arrow" />
      </div>
    );
  }

  renderHierarchicalSelector(): React.Node {
    const {
      onItemSelected,
      defaultDropdownText,
      buttonClassName,
      selectedItem,
      showLoadingSpinnerOnButton,
      ...passThroughProps
    } = this.props;
    const { menuButtonElt, selectorOpen } = this.state;
    return (
      <Popover
        doNotFlip
        keepInWindow
        anchorElt={menuButtonElt}
        anchorOrigin={Popover.Origins.BOTTOM_LEFT}
        containerType={Popover.Containers.NONE}
        isOpen={selectorOpen}
        onRequestClose={() => this.setState({ selectorOpen: false })}
        popoverOrigin={Popover.Origins.TOP_LEFT}
      >
        <HierarchicalSelector
          onItemClick={this.onHierarchyItemClicked}
          {...passThroughProps}
        />
      </Popover>
    );
  }

  render(): React.Node {
    return (
      <div>
        {this.renderDropdownButton()}
        {this.state.selectorOpen && this.renderHierarchicalSelector()}
      </div>
    );
  }
}
