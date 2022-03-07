// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Dropdown from 'components/ui/Dropdown';
import FilterSearchDropdown from 'components/common/QueryBuilder/CustomizableFilterTag/DimensionValueCustomizationModule/FilterSearchDropdown';
import I18N from 'lib/I18N';
import useDimensionValueMap from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock/useDimensionValueMap';
import { noop } from 'util/util';
import type DimensionValue from 'models/core/wip/Dimension/DimensionValue';
import type DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';

type Props = {
  filter: DimensionValueFilterItem | void,
  onFilterCustomized: DimensionValueFilterItem => void,
};

export default function FilterSelectionDropdown({
  filter,
  onFilterCustomized,
}: Props): React.Node {
  const dimensionValueMap = useDimensionValueMap();

  const onSelectionChange = React.useCallback(
    (dimensionValues: $ReadOnlyArray<DimensionValue>) => {
      if (filter !== undefined) {
        onFilterCustomized(
          filter.dimensionValues(Zen.Array.create(dimensionValues)),
        );
      }
    },
    [filter, onFilterCustomized],
  );

  if (filter === undefined) {
    // Show a disabled dropdown if we don't have an existing filter to modify.
    return (
      <Dropdown
        buttonClassName="alert-definition-modal__filters-dropdown--disabled"
        disableSelect
        value={undefined}
        onSelectionChange={noop}
        buttonWidth="100%"
        defaultDisplayContent={I18N.text('Choose filters')}
      />
    );
  }

  return (
    <FilterSearchDropdown
      dimensionValueMap={dimensionValueMap}
      itemToCustomize={filter}
      onSelectionChange={onSelectionChange}
    />
  );
}
