// @flow
import * as React from 'react';

import AsyncFilterSearchDropdown from 'components/common/QueryBuilder/CustomizableFilterTag/DimensionValueCustomizationModule/AsyncFilterSearchDropdown';
import DimensionValueSearchService from 'services/wip/DimensionValueSearchService';
import Dropdown from 'components/ui/Dropdown';
import SyncFilterSearchDropdown from 'components/common/QueryBuilder/CustomizableFilterTag/DimensionValueCustomizationModule/SyncFilterSearchDropdown';
import type DimensionValue from 'models/core/wip/Dimension/DimensionValue';
import type DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';

type Props = {
  dimensionValueMap: $PropertyType<
    React.ElementConfig<typeof SyncFilterSearchDropdown>,
    'dimensionValueMap',
  >,
  itemToCustomize: DimensionValueFilterItem,
  onSelectionChange: (
    dimensionValues: $ReadOnlyArray<DimensionValue>,
    event: SyntheticEvent<HTMLElement>,
  ) => void,

  /**
   * An optional function that filters out dimension values that should
   * not be able to be selected by the user
   */
  buildSelectableDimensionValues?: (
    DimensionValueFilterItem,
    $ReadOnlyArray<DimensionValue>,
  ) => $ReadOnlyArray<DimensionValue>,
  getDimensionValuesBySearchTerm?: (
    string,
    string,
  ) => Promise<Array<DimensionValue>>,
  windowEdgeThresholds?: {
    bottom?: number,
    left?: number,
    right?: number,
    top?: number,
  } | void,
};

export default function FilterSearchDropdown({
  dimensionValueMap,
  itemToCustomize,
  onSelectionChange,
  windowEdgeThresholds,
  buildSelectableDimensionValues = (item, dimensionValues) => dimensionValues,
  getDimensionValuesBySearchTerm = DimensionValueSearchService.get,
}: Props): React.Node {
  const renderDimensionValueOptions = (
    dimensionValues: $ReadOnlyArray<DimensionValue>,
  ): $ReadOnlyArray<React.Element<Class<Dropdown.Option<DimensionValue>>>> => {
    return buildSelectableDimensionValues(itemToCustomize, dimensionValues).map(
      dimensionValue => (
        <Dropdown.Option
          key={dimensionValue.id()}
          value={dimensionValue}
          searchableText={dimensionValue.searchableText()}
        >
          {dimensionValue.name()}
          <span className="filter-customization-module__dimension-value-subtitle">
            {dimensionValue.subtitle()}
          </span>
        </Dropdown.Option>
      ),
    );
  };

  const dimensionValues = dimensionValueMap[itemToCustomize.dimension()];

  // For most dimensions we cache all the dimension values in
  // dimensionValueMap and use a synchronous frontend search. However, for
  // some with a large number of possible values we use an async backend
  // search instead.
  if (dimensionValues) {
    return (
      <SyncFilterSearchDropdown
        dimensionValueMap={dimensionValueMap}
        itemToCustomize={itemToCustomize}
        onSelectionChange={onSelectionChange}
        renderDimensionValueOptions={renderDimensionValueOptions}
        windowEdgeThresholds={windowEdgeThresholds}
      />
    );
  }

  return (
    <AsyncFilterSearchDropdown
      getDimensionValuesBySearchTerm={getDimensionValuesBySearchTerm}
      itemToCustomize={itemToCustomize}
      onSelectionChange={onSelectionChange}
      renderDimensionValueOptions={renderDimensionValueOptions}
      windowEdgeThresholds={windowEdgeThresholds}
    />
  );
}
