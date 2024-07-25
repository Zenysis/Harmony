// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import HierarchicalSelector from 'components/ui/HierarchicalSelector';
import I18N from 'lib/I18N';
import Popover from 'components/ui/Popover';
import { noop } from 'util/util';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

/**
 * This component is used to select the parts of a query (e.g. filters,
 * indicators, group-bys).
 *
 * The QueryPartSelector is a combination of (a) an Add/Close button,
 * and (b) the HierarchicalSelector that opens/closes when this button
 * is clicked.
 */

type Props<T> = {
  // Custom button to render instead of the default "add" button.
  button?: React.Node | ((menuIsOpen: boolean) => React.Node) | void,

  // Flag to control if the selector closes when an item is selected.
  closeOnSelect?: boolean,

  // Flag to control if the selector collapses when root categories change.
  collapseOnRootChange?: boolean,

  // Function to generate the title for each column in the HierarchicalSelector.
  columnTitleGenerator: (HierarchyItem<T>) => React.Node,
  columnWidth?: number,
  enableSearch?: boolean,
  hierarchyRoot: HierarchyItem<T>,

  // Callback for when a Leaf item is selected in the HierarchicalSelector.
  onItemSelect?: (item: HierarchyItem<T>) => void,
  onMenuOpen: () => void,
  unselectableItems?: Zen.Array<string>,
};

export default function QueryPartSelector<T: NamedItem>({
  columnTitleGenerator,
  hierarchyRoot,
  onMenuOpen,

  button = undefined,
  closeOnSelect = false,
  collapseOnRootChange = false,
  columnWidth = 400,
  enableSearch = false,
  onItemSelect = noop,
  unselectableItems = Zen.Array.create<string>(),
}: Props<T>): React.Node {
  const [
    menuButtonElt,
    setMenuButtonElt,
  ] = React.useState<HTMLDivElement | void>(undefined);
  const [menuIsOpen, setMenuIsOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (menuIsOpen) {
      onMenuOpen();
    }
  }, [menuIsOpen, onMenuOpen]);

  const onMenuButtonClick = (event: SyntheticEvent<HTMLDivElement>) => {
    setMenuButtonElt(event.currentTarget);
    setMenuIsOpen(!menuIsOpen);
  };

  const onHierarchyItemSelect = React.useCallback(
    (hierarchyItem: HierarchyItem<T>) => {
      if (hierarchyItem.isLeafItem()) {
        onItemSelect(hierarchyItem);

        if (closeOnSelect) {
          setMenuIsOpen(false);
        }
      }
    },
    [onItemSelect, closeOnSelect],
  );

  const menuButton = React.useMemo(() => {
    // If the user provided a custom button, render that
    if (button !== undefined) {
      if (typeof button === 'function') {
        return button(menuIsOpen);
      }
      return button;
    }

    const btnText = menuIsOpen ? I18N.textById('Close') : I18N.text('Add');
    const btnIcon = menuIsOpen ? 'glyphicon-minus' : 'glyphicon-plus';
    return (
      <div className="query-part-selector__add-btn">
        <div className="query-part-selector__add-btn-contents">
          {btnText}
          <i className={`glyphicon ${btnIcon} query-part-selector__btn-icon`} />
        </div>
      </div>
    );
  }, [button, menuIsOpen]);

  const hierarchicalSelector = React.useMemo(() => {
    return (
      <Popover
        anchorElt={menuButtonElt}
        anchorOrigin={Popover.Origins.BOTTOM_LEFT}
        containerType={Popover.Containers.NONE}
        doNotFlip
        isOpen={menuIsOpen}
        keepInWindow
        onRequestClose={() => setMenuIsOpen(false)}
        popoverOrigin={Popover.Origins.TOP_LEFT}
      >
        <HierarchicalSelector
          collapseOnRootChange={collapseOnRootChange}
          columnTitleGenerator={columnTitleGenerator}
          columnWidth={columnWidth}
          enableSearch={enableSearch}
          hierarchyLoaded={!hierarchyRoot.isChildrenEmpty()}
          hierarchyRoot={hierarchyRoot}
          maxHeight={400}
          maxWidth={1000}
          onItemClick={onHierarchyItemSelect}
          unselectableHierarchyItems={unselectableItems}
        />
      </Popover>
    );
  }, [
    collapseOnRootChange,
    columnTitleGenerator,
    columnWidth,
    enableSearch,
    hierarchyRoot,
    menuButtonElt,
    menuIsOpen,
    onHierarchyItemSelect,
    unselectableItems,
  ]);

  return (
    <div className="query-part-selector">
      <div
        className="query-part-selector__btn-wrapper"
        onClick={onMenuButtonClick}
        role="button"
      >
        {menuButton}
      </div>
      {hierarchicalSelector}
    </div>
  );
}
