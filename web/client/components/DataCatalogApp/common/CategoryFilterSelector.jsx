// @flow
import * as React from 'react';
import classNames from 'classnames';

import Caret from 'components/ui/Caret';
import Heading from 'components/ui/Heading';
import HierarchicalSelector from 'components/ui/HierarchicalSelector';
import HierarchicalSelectorWrapper from 'components/DataCatalogApp/common/HierarchicalSelectorWrapper';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

type Props = {
  ...React.ElementConfig<typeof HierarchicalSelector>,
  buttonTitle: string | void,
  onApplyButtonClick: (HierarchyItem<NamedItem>) => void,

  allowRootSelection?: boolean,
  applyButtonText?: string,
  buttonSize?: $Values<typeof Heading.Sizes>,
  defaultButtonTitle?: string,
};

const TEXT = {
  applyButtonText: 'Apply',
  defaultButtonTitle: 'No category selected',
};

// Only allow categories to be selected inside the CategoryFilter.
function testItemSelectable(item: HierarchyItem<NamedItem>): boolean {
  return item.isCategoryItem();
}

/**
 * CategoryFilterSelector is an uncontrolled component that allows a user to
 * select a category in a HierarchicalSelector to filter by. The selected
 * category only gets applied when the user presses the Apply button.
 *
 * NOTE(stephen): This component is similar to HierarchicalSelectorDropdown.
 * After much experimenting, it was easier to create a new component than to add
 * the features into the core ui component. Main reason was the uncontrolled
 * nature and the usage of *categories* to select instead of *fields*.
 */
function CategoryFilterSelector({
  buttonTitle,
  hierarchyRoot,
  onApplyButtonClick,

  allowRootSelection = true,
  applyButtonText = TEXT.applyButtonText,
  buttonSize = 'large',
  defaultButtonTitle = TEXT.defaultButtonTitle,
  ...passThroughProps
}: Props) {
  const [selectorElt, setSelectorElt] = React.useState(null);
  const [selectorOpen, setSelectorOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState(hierarchyRoot);

  React.useEffect(() => {
    // Simulate an `onBlur` style event to detect when the user clicks outside
    // the hierarchical selector.
    function onDocumentClick({ target }: MouseEvent) {
      if (
        target instanceof Node &&
        selectorElt &&
        !selectorElt.contains(target)
      ) {
        setSelectorOpen(false);
      }
    }

    if (selectorOpen) {
      document.addEventListener('click', onDocumentClick);
    }
    return () => {
      document.removeEventListener('click', onDocumentClick);
    };
  }, [selectorElt, selectorOpen]);

  const onButtonClick = React.useCallback(() => {
    onApplyButtonClick(selectedItem);
    setSelectorOpen(false);
  }, [onApplyButtonClick, selectedItem]);

  const buttonClassName = classNames('category-filter-selector__button', {
    'category-filter-selector__button--open': selectorOpen,
  });

  // NOTE(stephen): Using `display: none` instead of removing the component from
  // the tree when the selector is closed so that we can preserve the current
  // state of the HierarchicalSelector. This allows the user to return back to
  // the same place when they reopen the selector.
  return (
    <div className="category-filter-selector" ref={setSelectorElt}>
      <div
        className={buttonClassName}
        onClick={() => setSelectorOpen(!selectorOpen)}
        role="button"
      >
        <Heading
          className="category-filter-selector__button-content"
          size={buttonSize}
        >
          {buttonTitle || defaultButtonTitle}
        </Heading>
        <Caret className="category-filter-selector__button-arrow" />
      </div>
      <div
        className="category-filter-selector__selector-container"
        style={{ display: selectorOpen ? undefined : 'none' }}
      >
        <HierarchicalSelectorWrapper
          applyButtonText={applyButtonText}
          disableApplyButton={
            !allowRootSelection && selectedItem === hierarchyRoot
          }
          hierarchyRoot={hierarchyRoot}
          onApplyButtonClick={onButtonClick}
          onHierarchyPathTailChange={setSelectedItem}
          testItemSelectable={testItemSelectable}
          {...passThroughProps}
        />
      </div>
    </div>
  );
}

export default (React.memo(
  CategoryFilterSelector,
): React.AbstractComponent<Props>);
