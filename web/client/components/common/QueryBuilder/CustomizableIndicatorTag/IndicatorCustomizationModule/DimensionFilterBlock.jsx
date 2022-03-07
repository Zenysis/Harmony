// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import FilterSelectionBlock from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock';
import autobind from 'decorators/autobind';
import type Field from 'models/core/wip/Field';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type Props = {
  dimensionValueMap: $PropertyType<
    React.ElementConfig<typeof FilterSelectionBlock>,
    'dimensionValueMap',
  >,
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof FilterSelectionBlock>,
    'hierarchyRoot',
  >,
  itemToCustomize: Field,
  onDimensionFiltersChange: Field => void,
};

const TEXT = t(
  'common.QueryBuilder.CustomizableIndicatorTag.IndicatorCustomizationModule.DimensionFilterBlock',
);

export default class DimensionFilterBlock extends React.PureComponent<Props> {
  @autobind
  onSelectedDimensionsChanged(selectedDimensions: Zen.Array<QueryFilterItem>) {
    const { itemToCustomize, onDimensionFiltersChange } = this.props;
    onDimensionFiltersChange(
      itemToCustomize.customizableFilterItems(selectedDimensions),
    );
  }

  render(): React.Node {
    const { dimensionValueMap, hierarchyRoot, itemToCustomize } = this.props;
    return (
      <div className="indicator-customization-module__filter-block">
        <FilterSelectionBlock
          dimensionValueMap={dimensionValueMap}
          hierarchyRoot={hierarchyRoot}
          onSelectedItemsChanged={this.onSelectedDimensionsChanged}
          selectedItems={itemToCustomize.customizableFilterItems()}
          helpText={TEXT.helpText}
        />
      </div>
    );
  }
}
