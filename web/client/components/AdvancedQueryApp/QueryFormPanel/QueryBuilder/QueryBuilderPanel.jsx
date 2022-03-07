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
  dimensionValueMap: $PropertyType<
    React.ElementConfig<typeof IndicatorSelectionBlock>,
    'dimensionValueMap',
  >,
  dimensions: $PropertyType<
    React.ElementConfig<typeof IndicatorSelectionBlock>,
    'dimensions',
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
  trackFieldSelected: $PropertyType<
    React.ElementConfig<typeof IndicatorSelectionBlock>,
    'trackItemSelected',
  >,

  fieldCustomizationModuleComponent?: $PropertyType<
    React.ElementConfig<typeof IndicatorSelectionBlock>,
    'customizationModuleComponent',
  >,
  supportedGroupingDimensions?: $PropertyType<
    React.ElementConfig<typeof GroupBySelectionBlock>,
    'supportedDimensions',
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

  // NOTE(stephen): Right now, we are ANDing all filters together. In the
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
        dimensionValueMap={dimensionValueMap}
        dimensions={dimensions}
        filterHierarchyRoot={filterHierarchyRoot}
        hierarchyRoot={fieldHierarchyRoot}
        onSelectedItemsChanged={onIndicatorFieldsChanged}
        selectedItems={querySelections.fields()}
        trackItemSelected={trackFieldSelected}
      />
      <GroupBySelectionBlock
        hierarchyRoot={groupingHierarchyRoot}
        onSelectedItemsChanged={onGroupDimensionsChanged}
        selectedItems={querySelections.groups()}
        supportedDimensions={supportedGroupingDimensions}
      />
      <FilterSelectionBlock
        dimensionValueMap={dimensionValueMap}
        hierarchyRoot={filterHierarchyRoot}
        onSelectedItemsChanged={onFiltersChanged}
        selectedItems={querySelections.filter()}
      />
    </div>
  );
}

export default (React.memo(QueryBuilderPanel): React.AbstractComponent<Props>);
