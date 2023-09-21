// @flow
import * as React from 'react';
import classnames from 'classnames';
import invariant from 'invariant';

import Caret from 'components/ui/Caret';
import DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import Dropdown from 'components/ui/Dropdown';
import FilterSelectionDropdown from 'components/AlertsApp/ComposeAlertDefinitionModal/FilterSelectionDropdown';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import LabelWrapper from 'components/ui/LabelWrapper';
import QueryPartSelector from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock/QueryPartSelector';
import useFilterHierarchy from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock/useFilterHierarchy';
import { noop } from 'util/util';
import type CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import type Dimension from 'models/core/wip/Dimension';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type LinkedCategory from 'models/core/wip/LinkedCategory';

const TIME_GRANULARITY_OPTIONS = {
  day: I18N.text('Day'),
  month: I18N.text('Month'),
  week: I18N.text('Week (Monday to Sunday)'),
};
const TIME_GRANULARITY_DROPDOWN_OPTIONS = Object.keys(
  TIME_GRANULARITY_OPTIONS,
).map(key => (
  <Dropdown.Option key={key} value={key}>
    {TIME_GRANULARITY_OPTIONS[key]}
  </Dropdown.Option>
));

type Props = {
  dimension: Dimension | void,
  filter: DimensionValueFilterItem | void,
  onDimensionChange: (newDimension: Dimension | void) => void,
  setDimension: (Dimension | void) => void,
  setFilter: (DimensionValueFilterItem | void) => void,
  setTimeDropdownSelection: string => void,
  showErrorState: boolean,
  timeDropdownSelection: string,
};

export default function GroupByAndFilterConditions({
  dimension,
  filter,
  onDimensionChange,
  setDimension,
  setFilter,
  setTimeDropdownSelection,
  showErrorState,
  timeDropdownSelection,
}: Props): React.Node {
  const dimensionHierarchyRoot = useFilterHierarchy(true);

  const onDimensionSelect = React.useCallback(
    item => {
      const newDimension = item.metadata();
      invariant(newDimension.tag === 'DIMENSION', 'Item must be a dimension');
      setDimension(newDimension);
      onDimensionChange(newDimension);
    },
    [onDimensionChange, setDimension],
  );

  const groupbyClassName = classnames(
    'alert-definition-modal__groupby-dropdown',
    {
      'alert-definition-modal__groupby-dropdown--error':
        showErrorState && dimension === undefined,
    },
  );

  const button = (
    <Group.Horizontal
      alignItems="center"
      className="alert-definition-modal__groupby-dropdown-button"
      firstItemClassName="alert-definition-modal__groupby-dropdown-text"
      firstItemFlexValue={1}
      flex
    >
      {dimension ? dimension.name() : I18N.text('Choose group by')}
      <Caret className="zen-dropdown-button__caret" />
    </Group.Horizontal>
  );

  const columnTitleGenerator = (
    item: HierarchyItem<LinkedCategory | Dimension | CustomizableTimeInterval>,
  ): string => (item.id() === 'root' ? I18N.textById('Select a category') : '');

  return (
    <Group.Horizontal
      itemClassName="alert-definition-modal__column"
      spacing="m"
    >
      <LabelWrapper
        contentClassName={groupbyClassName}
        label={I18N.text('By what group by')}
        labelClassName="alert-definition-modal__heading"
      >
        <QueryPartSelector
          button={button}
          closeOnSelect
          columnTitleGenerator={columnTitleGenerator}
          hierarchyRoot={dimensionHierarchyRoot}
          onItemSelect={onDimensionSelect}
          onMenuOpen={noop}
        />
      </LabelWrapper>
      <LabelWrapper
        label={I18N.text('Filter group by on')}
        labelClassName="alert-definition-modal__heading"
      >
        <FilterSelectionDropdown
          filter={filter}
          onFilterCustomized={setFilter}
        />
      </LabelWrapper>
      <LabelWrapper
        label={I18N.text('By what frequency')}
        labelClassName="alert-definition-modal__heading"
      >
        <Dropdown
          buttonClassName="alert-definition-modal__dropdown"
          buttonWidth="100%"
          menuWidth="100%"
          onSelectionChange={setTimeDropdownSelection}
          value={timeDropdownSelection}
        >
          {TIME_GRANULARITY_DROPDOWN_OPTIONS}
        </Dropdown>
      </LabelWrapper>
    </Group.Horizontal>
  );
}
