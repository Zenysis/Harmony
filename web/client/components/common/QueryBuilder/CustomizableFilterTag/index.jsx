// @flow
import * as React from 'react';
import classNames from 'classnames';
import invariant from 'invariant';

import CustomizableTag from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock/CustomizableTag';
import DateFilterCustomizationModule from 'components/common/QueryBuilder/CustomizableFilterTag/DateFilterCustomizationModule';
import DimensionValueCustomizationModule from 'components/common/QueryBuilder/CustomizableFilterTag/DimensionValueCustomizationModule';
import DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import DimensionValueSearchService from 'services/wip/DimensionValueSearchService';
import Tag from 'components/ui/Tag';
import buildTagName from 'components/common/QueryBuilder/CustomizableFilterTag/buildTagName';
import filterItemIsEmpty from 'components/common/QueryBuilder/CustomizableFilterTag/filterItemIsEmpty';
import type CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import type DimensionValue from 'models/core/wip/Dimension/DimensionValue';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';
import type { TagSize } from 'components/ui/Tag';

type Props = {
  /**
   * A map of all dimension ids to their available dimension values. We use
   * this so the filter can be customized.
   */
  dimensionValueMap: $PropertyType<
    React.ElementConfig<typeof DimensionValueCustomizationModule>,
    'dimensionValueMap',
  >,

  /** The filter item represented by this tag */
  item: QueryFilterItem,

  /** Callback for when 'Apply' is clicked in the customization module */
  onApplyClick: (
    item: CustomizableTimeInterval | DimensionValueFilterItem,
  ) => void,

  /** Callback for when this tag is removed */
  onRemoveTagClick: (item: QueryFilterItem) => void,

  /** Callback for when the customization module is closed */
  onRequestCloseCustomizationModule: () => void,

  /** Callback for when the tag is clicked */
  onTagClick: (item: QueryFilterItem) => void,

  showCustomizationModule: boolean,

  /**
   * An optional function that filters out dimension values that should
   * not be able to be selected by the user
   */
  buildSelectableDimensionValues?: (
    DimensionValueFilterItem,
    $ReadOnlyArray<DimensionValue>,
  ) => $ReadOnlyArray<DimensionValue>,

  getDimensionValuesBySearchTerm?: (
    string,
    string,
  ) => Promise<Array<DimensionValue>>,
  className?: string,

  /**
   * By default, date filters render in a two-line format. Sometimes we want to
   * render this as a single line, so this flag would need to be set to `true`.
   */
  keepDateTagInSingleLine?: boolean,
  showDragHandle?: boolean,
  tagSize?: TagSize,
};

const TEXT = t('common.QueryBuilder.CustomizableFilterTag');

function CustomizableFilterTag({
  dimensionValueMap,
  item,
  onApplyClick,
  onRemoveTagClick,
  onRequestCloseCustomizationModule,
  onTagClick,
  showCustomizationModule,
  buildSelectableDimensionValues = (i, dimensionValues) => dimensionValues,
  className = '',
  getDimensionValuesBySearchTerm = DimensionValueSearchService.get,
  keepDateTagInSingleLine = false,
  showDragHandle = true,
  tagSize = Tag.Sizes.SMALL,
}: Props) {
  invariant(
    item.tag !== 'SIMPLE_QUERY_FILTER_ITEM',
    'SimpleQueryFilterItem cannot be shown in the UI right now.',
  );

  // the customization module is uncontrolled and keeps track of its own
  // customized item. This allows for situations where we want the customization
  // module to keep updating, but we don't yet want the Tag to render the
  // customizations (until we click 'Apply', for example). When we close the
  // customization module, we will reset this back to the item we render in
  // the tag.
  const [customizedItem, setCustomizedItem] = React.useState<
    CustomizableTimeInterval | DimensionValueFilterItem,
  >(item.tag === 'UNAPPLIED_QUERY_FILTER_ITEM' ? item.item() : item);

  const resetCustomizedItem = React.useCallback(
    () =>
      setCustomizedItem(
        item.tag === 'UNAPPLIED_QUERY_FILTER_ITEM' ? item.item() : item,
      ),
    [item],
  );

  React.useEffect(resetCustomizedItem, [resetCustomizedItem]);

  const _onApplyClick = React.useCallback(() => {
    if (!filterItemIsEmpty(customizedItem)) {
      onApplyClick(customizedItem);
    } else {
      onRemoveTagClick(item);
    }
    onRequestCloseCustomizationModule();
  }, [
    customizedItem,
    item,
    onApplyClick,
    onRemoveTagClick,
    onRequestCloseCustomizationModule,
  ]);

  const onRequestClose = React.useCallback(() => {
    // Since we require the user to directly press the `Apply` button to commit
    // the filter change, if an `onRequestClose` event comes in, this means the
    // user has triggered the customization module to close without pressing
    // `Apply` (i.e. if they click outside the popover). When this happens,
    // ensure that the currently applied filter item is not empty. If it is,
    // then we should remove it.
    if (filterItemIsEmpty(item)) {
      onRemoveTagClick(item);
    }
    // When we close the customization module, reset the customizableItem we
    // have been customizing back to its previously applied value passed via
    // props.
    resetCustomizedItem();
    onRequestCloseCustomizationModule();
  }, [
    item,
    onRemoveTagClick,
    onRequestCloseCustomizationModule,
    resetCustomizedItem,
  ]);

  const renderCustomizationModule = React.useCallback(() => {
    if (customizedItem.tag === 'DIMENSION_VALUE_FILTER_ITEM') {
      return (
        <DimensionValueCustomizationModule
          buildSelectableDimensionValues={buildSelectableDimensionValues}
          getDimensionValuesBySearchTerm={getDimensionValuesBySearchTerm}
          dimensionValueMap={dimensionValueMap}
          itemToCustomize={customizedItem}
          onItemCustomized={setCustomizedItem}
        />
      );
    }

    if (customizedItem.tag === 'CUSTOMIZABLE_TIME_INTERVAL') {
      return (
        <DateFilterCustomizationModule
          itemToCustomize={customizedItem}
          onItemCustomized={setCustomizedItem}
          onApplyClick={_onApplyClick}
          onDateChanged={setCustomizedItem}
        />
      );
    }

    // TODO(stephen): Figure out error handling.
    throw new Error('Illegal customization item type.');
  }, [
    _onApplyClick,
    buildSelectableDimensionValues,
    customizedItem,
    dimensionValueMap,
    getDimensionValuesBySearchTerm,
  ]);

  const isDateFilterSelected =
    customizedItem.tag === 'CUSTOMIZABLE_TIME_INTERVAL';

  const tagClassName = classNames(className, {
    'customizable-filter-tag--date-unapplied':
      isDateFilterSelected && showCustomizationModule,
  });

  return (
    <CustomizableTag
      showApplyButton
      className={tagClassName}
      item={item}
      onApplyClick={_onApplyClick}
      onCloseCustomizationModuleClick={onRequestClose}
      onRemoveTagClick={onRemoveTagClick}
      onTagClick={onTagClick}
      renderCustomizationModule={renderCustomizationModule}
      showCustomizationModule={showCustomizationModule}
      tagName={buildTagName(customizedItem, keepDateTagInSingleLine)}
      showDragHandle={showDragHandle}
      tagSize={tagSize}
      useDefaultCustomizationModuleContainer={!isDateFilterSelected}
      customizationModuleARIAName={TEXT.title}
    />
  );
}

export default (React.memo(
  CustomizableFilterTag,
): React.AbstractComponent<Props>);
