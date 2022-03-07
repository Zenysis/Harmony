// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import HierarchicalSelector from 'components/ui/HierarchicalSelector';
import Popover from 'components/ui/Popover';
import autobind from 'decorators/autobind';
import { noop } from 'util/util';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

/**
 * This component is used to select the parts of a query (e.g. filters,
 * indicators, group by).
 * The QueryPartSelector is just a combination of an Add/Close button,
 * and the HierarchicalSelector that opens/closes when this button
 * is clicked.
 */

type DefaultProps<T> = {
  // Custom button to render instead of the default "add" button.
  button: React.Node | ((menuIsOpen: boolean) => React.Node) | void,

  // control if we should close the selector when an item is selected
  closeOnSelect: boolean,
  columnWidth: number,
  enableSearch: boolean,

  // callback for when a Leaf item is selected (not triggered when a category
  // item is selected)
  onItemSelect: (item: HierarchyItem<T>) => void,
  unselectableItems: Zen.Array<string>,
};

type Props<T> = {
  ...DefaultProps<T>,
  columnTitleGenerator: (HierarchyItem<T>) => React.Node,
  hierarchyRoot: HierarchyItem<T>,
  onMenuOpen: () => void,
};

type State = {
  menuButtonElt: HTMLDivElement | void,
  menuIsOpen: boolean,
};

const TEXT = t(
  'AdvancedQueryApp.QueryFormPanel.QueryBuilder.SelectionBlock.QueryPartSelector',
);

export default class QueryPartSelector<
  T: NamedItem,
> extends React.PureComponent<Props<T>, State> {
  static defaultProps: DefaultProps<T> = {
    button: undefined,
    closeOnSelect: false,
    columnWidth: 400,
    enableSearch: false,
    onItemSelect: noop,
    unselectableItems: Zen.Array.create<string>(),
  };

  state: State = {
    menuButtonElt: undefined,
    menuIsOpen: false,
  };

  @autobind
  onMenuButtonClick(event: SyntheticEvent<HTMLDivElement>) {
    const menuButtonElt = event.currentTarget;
    this.setState(
      prevState => ({
        menuButtonElt,
        menuIsOpen: !prevState.menuIsOpen,
      }),
      () => {
        if (this.state.menuIsOpen) {
          this.props.onMenuOpen();
        }
      },
    );
  }

  @autobind
  onMenuClose() {
    this.setState({ menuIsOpen: false });
  }

  @autobind
  onItemSelect(hierarchyItem: HierarchyItem<T>) {
    const { closeOnSelect, onItemSelect } = this.props;
    if (hierarchyItem.isLeafItem()) {
      onItemSelect(hierarchyItem);

      if (closeOnSelect) {
        this.onMenuClose();
      }
    }
  }

  renderMenuButton(): React.Node {
    const { button } = this.props;
    const { menuIsOpen } = this.state;

    // Check if the user provided a custom button.
    if (button !== undefined) {
      if (typeof button === 'function') {
        return button(menuIsOpen);
      }
      return button;
    }

    const btnText = menuIsOpen ? TEXT.close : TEXT.add;
    const btnIcon = menuIsOpen ? 'glyphicon-minus' : 'glyphicon-plus';
    return (
      <div className="query-part-selector__add-btn">
        <div className="query-part-selector__add-btn-contents">
          {btnText}
          <i className={`glyphicon ${btnIcon} query-part-selector__btn-icon`} />
        </div>
      </div>
    );
  }

  renderHierarchicalSelector(): React.Node {
    const {
      columnTitleGenerator,
      columnWidth,
      enableSearch,
      hierarchyRoot,
      unselectableItems,
    } = this.props;
    const { menuButtonElt, menuIsOpen } = this.state;

    return (
      <Popover
        doNotFlip
        keepInWindow
        anchorElt={menuButtonElt}
        anchorOrigin={Popover.Origins.BOTTOM_LEFT}
        containerType={Popover.Containers.NONE}
        isOpen={menuIsOpen}
        onRequestClose={this.onMenuClose}
        popoverOrigin={Popover.Origins.TOP_LEFT}
      >
        <HierarchicalSelector
          columnTitleGenerator={columnTitleGenerator}
          columnWidth={columnWidth}
          enableSearch={enableSearch}
          hierarchyLoaded={!hierarchyRoot.isChildrenEmpty()}
          hierarchyRoot={hierarchyRoot}
          maxHeight={400}
          maxWidth={1000}
          onItemClick={this.onItemSelect}
          unselectableHierarchyItems={unselectableItems}
        />
      </Popover>
    );
  }

  render(): React.Node {
    return (
      <div className="query-part-selector">
        <div
          className="query-part-selector__btn-wrapper"
          onClick={this.onMenuButtonClick}
          role="button"
        >
          {this.renderMenuButton()}
        </div>
        {this.renderHierarchicalSelector()}
      </div>
    );
  }
}
