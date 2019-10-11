// @flow
import * as React from 'react';

import Caret from 'components/ui/Caret';
import HierarchicalSelector from 'components/ui/HierarchicalSelector';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import MainColumnArea from 'components/ui/HierarchicalSelector/MainColumnArea';
import { autobind } from 'decorators';

type Props = {|
  buttonClassName: string,

  hierarchyRoot: HierarchyItem,

  /** Used to determine if a loading spinner should be shown. */
  hierarchyLoaded: boolean,

  /**
   * Generates the title of a column
   * @param {HierarchyItem} item The HierarchyItem that produced this column
   * @returns {string} The column title
   */
  columnTitleGenerator: $Prop<MainColumnArea, 'columnTitleGenerator'>,
  columnWidth: number,

  /** Text that appears on the dropdown button when no item has been selected */
  defaultDropdownText: string,
  enableSearch: boolean,

  /** Callback for when an item is selected */
  onItemSelected: (item: HierarchyItem) => void,
  /** Maximum height for the hierarchical Selector */
  maxHeight?: number,
  /** Maximum width for the hierarchical Selector */
  maxWidth: number,
  /** Currently selected dropdown item */
  selectedItem: HierarchyItem | void,
|};

type State = {
  selectorOpen: boolean,
};

/**
 * A wrapper for the hierarchical selector so that it can be used like a
 * dropdown menu to select a single item. The currently selected item is
 * controlled by the parent of this component through the selectedItem and
 * onItemSelected props.
 */
class HierarchicalSelectorDropdown extends React.PureComponent<Props, State> {
  static defaultProps = {
    buttonClassName: '',
    columnTitleGenerator: () => '',
    columnWidth: 400,
    enableSearch: false,
    hierarchyLoaded: true,
    maxHeight: undefined,
    maxWidth: 1000,
  };

  state = {
    selectorOpen: false,
  };

  _selectorRef: $RefObject<'div'> = React.createRef();

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (this.state.selectorOpen && !prevState.selectorOpen) {
      document.addEventListener('click', this.onDocumentClick);
    } else if (!this.state.selectorOpen && prevState.selectorOpen) {
      document.removeEventListener('click', this.onDocumentClick);
    }
  }

  @autobind
  toggleSelectorOpenState() {
    this.setState(state => ({ selectorOpen: !state.selectorOpen }));
  }

  @autobind
  onDocumentClick(e: MouseEvent) {
    // When we click anywhere in the document we want to check if we clicked
    // outside a menu so we can close it.
    const { target } = e;
    if (target instanceof window.Node) {
      const { current } = this._selectorRef;
      const selectorClicked = current && current.contains(target);
      if (!selectorClicked) {
        this.setState({ selectorOpen: false });
      }
    }
  }

  @autobind
  onHierarchyItemClicked(item: HierarchyItem) {
    if (item.isLeafItem()) {
      this.setState({ selectorOpen: false }, this.props.onItemSelected(item));
    }
  }

  @autobind
  renderDropdownButton() {
    const { buttonClassName, selectedItem } = this.props;
    const text = selectedItem
      ? selectedItem.name()
      : this.props.defaultDropdownText;
    return (
      <div
        role="button"
        className={`hierarchical-selector-dropdown__button ${buttonClassName}`}
        onClick={this.toggleSelectorOpenState}
      >
        {text}
        <Caret className="hierarchical-selector-dropdown__button-arrow" />
      </div>
    );
  }

  renderHierarchicalSelector() {
    const {
      onItemSelected,
      defaultDropdownText,
      ...passThroughProps
    } = this.props;
    return (
      <div
        className="hierarchical-selector-dropdown__selector-container"
        ref={this._selectorRef}
      >
        <HierarchicalSelector
          onItemClick={this.onHierarchyItemClicked}
          {...passThroughProps}
        />
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.renderDropdownButton()}
        {this.state.selectorOpen && this.renderHierarchicalSelector()}
      </div>
    );
  }
}

export default HierarchicalSelectorDropdown;
