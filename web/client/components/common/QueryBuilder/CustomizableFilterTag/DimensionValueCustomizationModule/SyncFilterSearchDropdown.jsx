// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import isSameDimensionValue from 'components/common/QueryBuilder/CustomizableFilterTag/DimensionValueCustomizationModule/isSameDimensionValue';
import type DimensionValue from 'models/core/wip/Dimension/DimensionValue';
import type DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';

const TEXT = t(
  'AdvancedQueryApp.QueryFormPanel.QueryBuilder.FilterSelectionBlock.DimensionValueCustomizationModule',
);

type Props = {
  dimensionValueMap: {
    +[dimensionId: string]: $ReadOnlyArray<DimensionValue>,
  },
  itemToCustomize: DimensionValueFilterItem,
  onSelectionChange: (
    dimensionValues: $ReadOnlyArray<DimensionValue>,
    event: SyntheticEvent<HTMLElement>,
  ) => void,
  renderDimensionValueOptions: (
    $ReadOnlyArray<DimensionValue>,
  ) => $ReadOnlyArray<React.Element<Class<Dropdown.Option<DimensionValue>>>>,
  windowEdgeThresholds?: {
    bottom?: number,
    left?: number,
    right?: number,
    top?: number,
  } | void,
};

export default function SyncFilterSearchDropdown({
  dimensionValueMap,
  itemToCustomize,
  onSelectionChange,
  renderDimensionValueOptions,
  windowEdgeThresholds,
}: Props): React.Element<typeof Dropdown.Multiselect> {
  const renderOptions = (): $ReadOnlyArray<
    React.Element<Class<Dropdown.Option<DimensionValue>>>,
  > => {
    const dimensionValues = dimensionValueMap[itemToCustomize.dimension()];

    return renderDimensionValueOptions(dimensionValues);
  };

  return (
    <Dropdown.Multiselect
      ariaName={TEXT.label}
      buttonWidth="100%"
      defaultDisplayContent={TEXT.emptySelectionsDropdownText}
      enableSearch
      isSameValue={isSameDimensionValue}
      menuMaxHeight={245}
      menuWidth="100%"
      onSelectionChange={onSelectionChange}
      pinSelectedOptions
      value={itemToCustomize.dimensionValues().arrayView()}
      windowEdgeThresholds={windowEdgeThresholds}
      blurType="overlay"
    >
      {renderOptions()}
    </Dropdown.Multiselect>
  );
}
