// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import DimensionValueSearchService from 'services/wip/DimensionValueSearchService';
import FilterSearchDropdown from 'components/common/QueryBuilder/CustomizableFilterTag/DimensionValueCustomizationModule/FilterSearchDropdown';
import I18N from 'lib/I18N';
import LabelWrapper from 'components/ui/LabelWrapper';
import NegateFilterCheckbox from 'components/common/QueryBuilder/CustomizableFilterTag/NegateFilterCheckbox';
import autobind from 'decorators/autobind';
import type DimensionValue from 'models/core/wip/Dimension/DimensionValue';
import type DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';

type DefaultProps = {
  /**
   * An optional function that filters out dimension values that should
   * not be able to be selected by the user
   */
  buildSelectableDimensionValues?: (
    DimensionValueFilterItem,
    $ReadOnlyArray<DimensionValue>,
  ) => $ReadOnlyArray<DimensionValue>,
  dimensionValueMap: $PropertyType<
    React.ElementConfig<typeof FilterSearchDropdown>,
    'dimensionValueMap',
  >,
  getDimensionValuesBySearchTerm: (
    string,
    string,
  ) => Promise<Array<DimensionValue>>,
  renderNegateFilter?: boolean,
};

type Props = {
  ...DefaultProps,
  itemToCustomize: DimensionValueFilterItem,
  onItemCustomized: (item: DimensionValueFilterItem) => void,
};

export default class DimensionValueCustomizationModule extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    buildSelectableDimensionValues: (itemToCustomize, dimensionValues) =>
      dimensionValues,
    dimensionValueMap: {},
    getDimensionValuesBySearchTerm: DimensionValueSearchService.get,
    renderNegateFilter: true,
  };

  @autobind
  onDimensionValuesChange(dimensionValues: $ReadOnlyArray<DimensionValue>) {
    const { itemToCustomize, onItemCustomized } = this.props;
    onItemCustomized(
      itemToCustomize.dimensionValues(Zen.Array.create(dimensionValues)),
    );
  }

  renderNegateFilterCheckbox(): React.Node {
    const { itemToCustomize, onItemCustomized } = this.props;
    return (
      <NegateFilterCheckbox
        key={itemToCustomize.id()}
        item={itemToCustomize}
        onItemCustomized={onItemCustomized}
      />
    );
  }

  render(): React.Node {
    const {
      buildSelectableDimensionValues,
      dimensionValueMap,
      getDimensionValuesBySearchTerm,
      itemToCustomize,
    } = this.props;

    return (
      <LabelWrapper label={I18N.textById('Select filter values')}>
        <FilterSearchDropdown
          buildSelectableDimensionValues={buildSelectableDimensionValues}
          dimensionValueMap={dimensionValueMap}
          getDimensionValuesBySearchTerm={getDimensionValuesBySearchTerm}
          itemToCustomize={itemToCustomize}
          onSelectionChange={this.onDimensionValuesChange}
          windowEdgeThresholds={{ bottom: 330 }}
        />
        {this.props.renderNegateFilter && this.renderNegateFilterCheckbox()}
      </LabelWrapper>
    );
  }
}
