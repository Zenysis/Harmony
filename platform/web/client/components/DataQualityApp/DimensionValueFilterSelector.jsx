// @flow
import * as React from 'react';

import CustomizableFilterTag from 'components/common/QueryBuilder/CustomizableFilterTag';
import DimensionService from 'services/wip/DimensionService';
import DimensionValueService from 'services/wip/DimensionValueService';
import FilterSelector from 'components/common/QueryBuilder/FilterSelector';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import Popover from 'components/ui/Popover';
import Tag from 'components/ui/Tag';
import getDimensionValueMap from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock/getDimensionValueMap';
import type Dimension from 'models/core/wip/Dimension';
import type DimensionValue from 'models/core/wip/Dimension/DimensionValue';
import type DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type Props = {
  filter: DimensionValueFilterItem | void,
  onDimensionValueFilterSelected: (
    selectedItem: DimensionValueFilterItem | void,
  ) => void,
};

function DimensionValueFilterSelector({
  filter,
  onDimensionValueFilterSelected,
}: Props) {
  const [isSelectorOpen, setIsSelectorOpen] = React.useState<boolean>(false);
  const [btnElt, setButtonElt] = React.useState<HTMLDivElement | void>(
    undefined,
  );

  const [
    isCustomizationModuleOpen,
    setIsCustomizationModuleOpen,
  ] = React.useState<boolean>(false);

  const [dimensions, setDimensions] = React.useState<$ReadOnlyArray<Dimension>>(
    [],
  );

  const [dimensionValueMap, setDimensionValueMap] = React.useState<{
    [dimensionId: string]: $ReadOnlyArray<DimensionValue>,
    ...,
  }>({});

  // load dimensionValueMap
  React.useEffect(() => {
    DimensionValueService.getAll().then(dimensionValues => {
      setDimensionValueMap(getDimensionValueMap(dimensionValues));
    });
  }, [setDimensionValueMap]);

  // load dimensions
  React.useEffect(() => {
    DimensionService.getAll().then(setDimensions);
  }, [setDimensions]);

  // Add filter button handlers
  const onFilterButtonClick = (event: SyntheticEvent<HTMLDivElement>) => {
    setIsSelectorOpen(prevIsOpen => !prevIsOpen);
    setButtonElt(event.currentTarget);
  };

  // Filter selector handlers
  const onRequestCloseSelector = () => setIsSelectorOpen(false);
  const onFilterSelected = (newDimensionValueFilter: QueryFilterItem) => {
    setIsSelectorOpen(false);
    onDimensionValueFilterSelected(
      ((newDimensionValueFilter: $Cast): DimensionValueFilterItem),
    );
    setIsCustomizationModuleOpen(true);
  };

  // Filter cutomization tag Handlers
  const onRemoveTagClick = () => onDimensionValueFilterSelected(undefined);
  const onTagClick = () =>
    setIsCustomizationModuleOpen(prevIsOpen => !prevIsOpen);
  const onRequestCloseCustomizationModule = () =>
    setIsCustomizationModuleOpen(false);
  const onFilterCustomizationApplied = (
    newDimensionValueFilter: QueryFilterItem,
  ) => {
    onDimensionValueFilterSelected(
      ((newDimensionValueFilter: $Cast): DimensionValueFilterItem),
    );
  };

  function maybeRenderFilterTag() {
    if (!filter) {
      return null;
    }

    const key = filter.dimension();

    return (
      <CustomizableFilterTag
        key={key}
        className="data-quality-geography-filter-selector__filter-tag"
        dimensionValueMap={dimensionValueMap}
        item={filter}
        onApplyClick={onFilterCustomizationApplied}
        onRemoveTagClick={onRemoveTagClick}
        onRequestCloseCustomizationModule={onRequestCloseCustomizationModule}
        onTagClick={onTagClick}
        showCustomizationModule={isCustomizationModuleOpen}
        showDragHandle={false}
        tagSize={Tag.Sizes.LARGE}
      />
    );
  }

  function renderAddFilterButton() {
    return (
      <button
        className="data-quality-geography-filter-selector__add-filter-button"
        onClick={onFilterButtonClick}
        type="button"
      >
        <Icon ariaHidden type="filter" /> {I18N.text('Add Filter')}
      </button>
    );
  }

  function renderFilterSelectorPopover() {
    return (
      <Popover
        anchorElt={btnElt}
        anchorOrigin={Popover.Origins.BOTTOM_LEFT}
        anchorOuterSpacing={7}
        containerType={Popover.Containers.NONE}
        isOpen={isSelectorOpen}
        onRequestClose={onRequestCloseSelector}
        popoverOrigin={Popover.Origins.TOP_LEFT}
      >
        <FilterSelector
          dimensions={dimensions}
          excludeTimeFilters
          flattenDimensionHierarchy
          onItemSelect={onFilterSelected}
        />
      </Popover>
    );
  }

  return (
    <div className="data-quality-geography-filter-selector">
      {renderAddFilterButton()}
      {renderFilterSelectorPopover()}
      {maybeRenderFilterTag()}
    </div>
  );
}

export default (React.memo(
  DimensionValueFilterSelector,
): React.AbstractComponent<Props>);
