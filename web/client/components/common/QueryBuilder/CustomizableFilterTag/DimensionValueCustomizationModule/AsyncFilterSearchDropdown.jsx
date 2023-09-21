// @flow
import * as React from 'react';

import DimensionValueSearchService from 'services/wip/DimensionValueSearchService';
import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import autobind from 'decorators/autobind';
import isSameDimensionValue from 'components/common/QueryBuilder/CustomizableFilterTag/DimensionValueCustomizationModule/isSameDimensionValue';
import type DimensionValue from 'models/core/wip/Dimension/DimensionValue';
import type DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';

type DefaultProps = {
  getDimensionValuesBySearchTerm: (
    string,
    string,
  ) => Promise<Array<DimensionValue>>,
};

type Props = {
  ...DefaultProps,
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

type State = {
  dimensionValues: $ReadOnlyArray<DimensionValue>,
};

export default class AsyncFilterSearchDropdown extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps: DefaultProps = {
    getDimensionValuesBySearchTerm: DimensionValueSearchService.get,
  };

  state: State = {
    dimensionValues: [],
  };

  getSelectedDimensionValues(): $ReadOnlyArray<DimensionValue> {
    const { itemToCustomize } = this.props;
    return itemToCustomize.dimensionValues().arrayView();
  }

  @autobind
  onSearch(searchText: string, callback: () => void) {
    const { getDimensionValuesBySearchTerm, itemToCustomize } = this.props;

    if (searchText.length) {
      getDimensionValuesBySearchTerm(
        searchText,
        itemToCustomize.dimension(),
      ).then(dimensionValues => this.setState({ dimensionValues }, callback));
    } else {
      this.setState({ dimensionValues: [] }, callback);
    }
  }

  render(): React.Node {
    const {
      onSelectionChange,
      renderDimensionValueOptions,
      windowEdgeThresholds,
    } = this.props;
    const { dimensionValues } = this.state;

    const selectedOptions = renderDimensionValueOptions(
      this.getSelectedDimensionValues(),
    );

    return (
      <Dropdown.Multiselect
        ariaName={I18N.text('Select filter values')}
        asyncSelectedOptions={selectedOptions}
        blurType="overlay"
        buttonWidth="100%"
        defaultDisplayContent={I18N.textById('0 selected')}
        enableSearch
        isSameValue={isSameDimensionValue}
        menuMaxHeight={245}
        menuWidth="100%"
        onAsyncSearch={this.onSearch}
        onSelectionChange={onSelectionChange}
        pinSelectedOptions
        value={this.getSelectedDimensionValues()}
        windowEdgeThresholds={windowEdgeThresholds}
      >
        {renderDimensionValueOptions(dimensionValues)}
      </Dropdown.Multiselect>
    );
  }
}
