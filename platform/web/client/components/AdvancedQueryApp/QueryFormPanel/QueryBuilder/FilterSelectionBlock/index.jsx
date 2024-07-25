// @flow
import * as React from 'react';

import CustomizableFilterTag from 'components/common/QueryBuilder/CustomizableFilterTag';
import FilterSelector from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock/FilterSelector';
import I18N from 'lib/I18N';
import QueryPartSelector from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock/QueryPartSelector';
import SelectionBlock from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock';
import UnappliedQueryFilterItem from 'models/core/wip/QueryFilterItem/UnappliedQueryFilterItem';
import useGeoFieldOrdering from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock/useGeoFieldOrdering';
import type {
  CustomQueryPartSelectorProps,
  SelectionProps,
} from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock';
import type { CustomizableTagProps } from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock/ExpandableTagList';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type Props = {
  ...SelectionProps<QueryFilterItem>,
  allowUnsupportedDimensionToggle?: boolean,
  button?: $PropertyType<
    React.ElementConfig<typeof QueryPartSelector>,
    'button',
  >,
  dimensionValueMap: $PropertyType<
    React.ElementConfig<typeof CustomizableFilterTag>,
    'dimensionValueMap',
  >,
  helpText?: string,
  hideUnsupportedDimensions?: boolean,
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof FilterSelector>,
    'hierarchyRoot',
  >,
  orientation?: 'horizontal' | 'vertical',
  renderNegateFilter?: boolean,
  showDragHandle?: boolean,
  showTitle?: boolean,
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
}

function FilterSelectionBlock({
  dimensionValueMap,
  hierarchyRoot,
  onSelectedItemsChanged,
  selectedItems,

  allowUnsupportedDimensionToggle = false,
  helpText = I18N.text(
    'Limit the data that you want to see in your results',
    'limitDataInResults',
  ),
  hideUnsupportedDimensions = false,
  supportedDimensions = undefined,
  button,
  showTitle = true,
  orientation,
  renderNegateFilter = true,
  showDragHandle = true,
}: Props) {
  const [hideUnsupportedFilters, setHideUnsupportedFilters] = React.useState(
    hideUnsupportedDimensions,
  );

  // setHideUnsupportedDimensions controls FilterSelector.unsupportedDimensionToggle
  // - undefined: toggle is disabled and will not be displayed
  // - setState function: toggle is enabled and will be displayed
  const setHideUnsupportedDimensions = allowUnsupportedDimensionToggle
    ? setHideUnsupportedFilters
    : undefined;

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
        onApplyClick={onItemCustomized}
        onRemoveTagClick={onRemoveTagClick}
        onRequestCloseCustomizationModule={onRequestCloseCustomizationModule}
        onTagClick={onTagClick}
        renderNegateFilter={renderNegateFilter}
        showCustomizationModule={showCustomizationModule}
        showDragHandle={showDragHandle}
      />
    ),
    [
      buildSelectableDimensionValues,
      dimensionValueMap,
      renderNegateFilter,
      showDragHandle,
    ],
  );

  // NOTE: Whenever a user selects an item in the FilterSelector, we
  // wrap the underlying QueryFilterItem type in an UnappliedQueryFilterItem.
  // This allows us to signal that a filter should not be included in a query to
  // the server because it has not yet been confirmed by the user.
  const renderQueryPartSelector = React.useCallback(
    ({ onItemSelect }: CustomQueryPartSelectorProps<QueryFilterItem>) => (
      <FilterSelector
        button={button}
        hideUnsupportedDimensions={hideUnsupportedFilters}
        hierarchyRoot={hierarchyRoot}
        onItemSelect={item =>
          onItemSelect(
            item.metadata(
              UnappliedQueryFilterItem.create({ item: item.metadata() }),
            ),
          )
        }
        setHideUnsupportedDimensions={setHideUnsupportedDimensions}
        supportedDimensions={supportedDimensions}
      />
    ),
    [
      button,
      hideUnsupportedFilters,
      hierarchyRoot,
      setHideUnsupportedDimensions,
      supportedDimensions,
    ],
  );

  return (
    <SelectionBlock
      customizeOnSelect
      helpText={helpText}
      onRemoveTag={logFilterItemRemoval}
      onSelectedItemsChanged={onSelectedItemsChanged}
      orientation={orientation}
      renderCustomizableTag={renderCustomizableTag}
      renderCustomQueryPartSelector={renderQueryPartSelector}
      selectedItems={selectedItems}
      title={showTitle ? I18N.textById('Filters') : undefined}
    />
  );
}

export default (React.memo(
  FilterSelectionBlock,
): React.AbstractComponent<Props>);
