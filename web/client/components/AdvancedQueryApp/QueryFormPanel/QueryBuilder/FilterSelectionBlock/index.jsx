// @flow
import * as React from 'react';

import CustomizableFilterTag from 'components/common/QueryBuilder/CustomizableFilterTag';
import FilterSelector from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock/FilterSelector';
import SelectionBlock from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock';
import UnappliedQueryFilterItem from 'models/core/wip/QueryFilterItem/UnappliedQueryFilterItem';
import useGeoFieldOrdering from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock/useGeoFieldOrdering';
import type {
  CustomQueryPartSelectorProps,
  SelectionProps,
} from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock';
import type { CustomizableTagProps } from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock/ExpandableTagList';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

const TEXT = t(
  'AdvancedQueryApp.QueryFormPanel.QueryBuilder.FilterSelectionBlock',
);

type Props = {
  ...SelectionProps<QueryFilterItem>,
  dimensionValueMap: $PropertyType<
    React.ElementConfig<typeof CustomizableFilterTag>,
    'dimensionValueMap',
  >,
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof FilterSelector>,
    'hierarchyRoot',
  >,

  helpText?: string,
  hideUnsupportedDimensions?: $PropertyType<
    React.ElementConfig<typeof FilterSelector>,
    'hideUnsupportedDimensions',
  >,
  supportedDimensions?: $PropertyType<
    React.ElementConfig<typeof FilterSelector>,
    'supportedDimensions',
  >,
};

function logFilterItemRemoval(item: QueryFilterItem) {
  let selectedField;
  if (item.tag === 'DIMENSION_VALUE_FILTER_ITEM') {
    selectedField = item.dimension();
  } else if (item.tag === 'CUSTOMIZABLE_TIME_INTERVAL') {
    selectedField = item.name();
  }
  analytics.track('Remove AQT Filter Type', {
    selectedField,
  });
}

function FilterSelectionBlock({
  dimensionValueMap,
  hierarchyRoot,
  onSelectedItemsChanged,
  selectedItems,

  helpText = TEXT.helpText,
  hideUnsupportedDimensions = undefined,
  supportedDimensions = undefined,
}: Props) {
  const buildSelectableDimensionValues = useGeoFieldOrdering(selectedItems);

  const renderCustomizableTag = React.useCallback(
    ({
      item,
      onItemCustomized,
      onRemoveTagClick,
      onRequestCloseCustomizationModule,
      onTagClick,
      showCustomizationModule,
    }: CustomizableTagProps<QueryFilterItem>) => (
      <CustomizableFilterTag
        buildSelectableDimensionValues={buildSelectableDimensionValues}
        className="aqt-customizable-filter-tag"
        dimensionValueMap={dimensionValueMap}
        item={item}
        onRemoveTagClick={onRemoveTagClick}
        onRequestCloseCustomizationModule={onRequestCloseCustomizationModule}
        onTagClick={onTagClick}
        showCustomizationModule={showCustomizationModule}
        onApplyClick={onItemCustomized}
      />
    ),
    [buildSelectableDimensionValues, dimensionValueMap],
  );

  // NOTE(stephen): Whenever a user selects an item in the FilterSelector, we
  // wrap the underlying QueryFilterItem type in an UnappliedQueryFilterItem.
  // This allows us to signal that a filter should not be included in a query to
  // the server because it has not yet been confirmed by the user.
  const renderQueryPartSelector = React.useCallback(
    ({ onItemSelect }: CustomQueryPartSelectorProps<QueryFilterItem>) => (
      <FilterSelector
        hideUnsupportedDimensions={hideUnsupportedDimensions}
        hierarchyRoot={hierarchyRoot}
        onItemSelect={item =>
          onItemSelect(
            item.metadata(
              UnappliedQueryFilterItem.create({ item: item.metadata() }),
            ),
          )
        }
        supportedDimensions={supportedDimensions}
      />
    ),
    [hideUnsupportedDimensions, hierarchyRoot, supportedDimensions],
  );

  return (
    <SelectionBlock
      customizeOnSelect
      title={TEXT.title}
      helpText={helpText}
      onRemoveTag={logFilterItemRemoval}
      onSelectedItemsChanged={onSelectedItemsChanged}
      renderCustomizableTag={renderCustomizableTag}
      renderCustomQueryPartSelector={renderQueryPartSelector}
      selectedItems={selectedItems}
    />
  );
}

export default (React.memo(
  FilterSelectionBlock,
): React.AbstractComponent<Props>);
