// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import FilterSelectionBlock from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock';
import GroupBySelectionBlock from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/GroupBySelectionBlock';
import IndicatorSelectionBlock from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/IndicatorSelectionBlock';
import QuerySelections from 'models/core/wip/QuerySelections';
import updateQuerySelectionsOnGroupingChange from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/GroupBySelectionBlock/updateQuerySelectionsOnGroupingChange';
import type Field from 'models/core/wip/Field';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type Props = {
  dimensions: $PropertyType<
    React.ElementConfig<typeof IndicatorSelectionBlock>,
    'dimensions',
  >,
  dimensionValueMap: $PropertyType<
    React.ElementConfig<typeof IndicatorSelectionBlock>,
    'dimensionValueMap',
  >,
  fieldCustomizationModuleComponent?: $PropertyType<
    React.ElementConfig<typeof IndicatorSelectionBlock>,
    'customizationModuleComponent',
  >,
  fieldHierarchyRoot: $PropertyType<
    React.ElementConfig<typeof IndicatorSelectionBlock>,
    'hierarchyRoot',
  >,
  filterHierarchyRoot: $PropertyType<
    React.ElementConfig<typeof FilterSelectionBlock>,
    'hierarchyRoot',
  >,
  groupingHierarchyRoot: $PropertyType<
    React.ElementConfig<typeof GroupBySelectionBlock>,
    'hierarchyRoot',
  >,
  onQuerySelectionsChange: QuerySelections => void,
  querySelections: QuerySelections,
  supportedGroupingDimensions?: $PropertyType<
    React.ElementConfig<typeof GroupBySelectionBlock>,
    'supportedDimensions',
  >,
  trackFieldSelected: $PropertyType<
    React.ElementConfig<typeof IndicatorSelectionBlock>,
    'trackItemSelected',
  >,
};

function QueryBuilderPanel({
  dimensionValueMap,
  dimensions,
  fieldHierarchyRoot,
  filterHierarchyRoot,
  groupingHierarchyRoot,
  onQuerySelectionsChange,
  querySelections,
  trackFieldSelected,

  fieldCustomizationModuleComponent = undefined,
  supportedGroupingDimensions = undefined,
}: Props) {
  const onIndicatorFieldsChanged = React.useCallback(
    (selectedIndicatorFields: Zen.Array<Field>) =>
      onQuerySelectionsChange(querySelections.fields(selectedIndicatorFields)),
    [onQuerySelectionsChange, querySelections],
  );

  const onGroupDimensionsChanged = React.useCallback(
    (selectedGroupDimensions: Zen.Array<GroupingItem>) => {
      const newQuerySelections = updateQuerySelectionsOnGroupingChange(
        querySelections,
        selectedGroupDimensions,
      );
      if (newQuerySelections !== querySelections) {
        onQuerySelectionsChange(newQuerySelections);
      }
    },
    [onQuerySelectionsChange, querySelections],
  );

  // NOTE: Right now, we are ANDing all filters together. In the
  // future, this will not be the case.
  const onFiltersChanged = React.useCallback(
    (selectedFilters: Zen.Array<QueryFilterItem>) =>
      onQuerySelectionsChange(querySelections.filter(selectedFilters)),
    [onQuerySelectionsChange, querySelections],
  );

  return (
    <div>
      <IndicatorSelectionBlock
        customizationModuleComponent={fieldCustomizationModuleComponent}
        dimensions={dimensions}
        dimensionValueMap={dimensionValueMap}
        filterHierarchyRoot={filterHierarchyRoot}
        hierarchyRoot={fieldHierarchyRoot}
        onSelectedItemsChanged={onIndicatorFieldsChanged}
        selectedItems={querySelections.fields()}
        trackItemSelected={trackFieldSelected}
      />
      <GroupBySelectionBlock
        allowUnsupportedDimensionToggle
        hierarchyRoot={groupingHierarchyRoot}
        onSelectedItemsChanged={onGroupDimensionsChanged}
        selectedItems={querySelections.groups()}
        supportedDimensions={supportedGroupingDimensions}
      />
      <FilterSelectionBlock
        allowUnsupportedDimensionToggle
        dimensionValueMap={dimensionValueMap}
        hierarchyRoot={filterHierarchyRoot}
        onSelectedItemsChanged={onFiltersChanged}
        selectedItems={querySelections.filter()}
        supportedDimensions={supportedGroupingDimensions}
      />
    </div>
  );
}

export default (React.memo(QueryBuilderPanel): React.AbstractComponent<Props>);
