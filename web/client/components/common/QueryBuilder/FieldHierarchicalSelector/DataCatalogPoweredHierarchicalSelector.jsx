// @flow

import * as React from 'react';

import Field from 'models/core/wip/Field';
import HierarchicalSelectorDropdown from 'components/ui/HierarchicalSelectorDropdown';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import useFieldHierarchyRoot from 'components/common/QueryBuilder/FieldHierarchicalSelector/useFieldHierarchyRoot';
import type LinkedCategory from 'models/core/wip/LinkedCategory';

type Props = {
  buttonClassName: string,
  defaultDropdownText: string,
  enableSearch: boolean,
  maxHeight?: number,
  selectedIndicatorItem: HierarchyItem<Field | LinkedCategory> | void,
  onIndicatorSelected: (
    selectedIndicatorItem: HierarchyItem<Field | LinkedCategory>,
  ) => void,
  showLoadingSpinnerOnButton: boolean,
};

function DataCatalogPoweredHierarchicalSelector({
  buttonClassName,
  defaultDropdownText,
  enableSearch,
  maxHeight,
  onIndicatorSelected,
  selectedIndicatorItem,
  showLoadingSpinnerOnButton = false,
}: Props): React.Node {
  const fieldHierarchyRoot = useFieldHierarchyRoot();

  return (
    <HierarchicalSelectorDropdown
      buttonClassName={buttonClassName}
      defaultDropdownText={defaultDropdownText}
      enableSearch={enableSearch}
      hierarchyRoot={fieldHierarchyRoot}
      hierarchyLoaded={fieldHierarchyRoot !== undefined}
      maxHeight={maxHeight}
      onItemSelected={onIndicatorSelected}
      selectedItem={selectedIndicatorItem}
      showLoadingSpinnerOnButton={showLoadingSpinnerOnButton}
    />
  );
}

export default DataCatalogPoweredHierarchicalSelector;
