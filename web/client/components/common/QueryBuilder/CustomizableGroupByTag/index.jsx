// @flow
import * as React from 'react';

import CustomizableTag from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock/CustomizableTag';
import GranularityCustomizationModule from 'components/common/QueryBuilder/CustomizableGroupByTag/GranularityCustomizationModule';
import GroupingDimensionCustomizationModule from 'components/common/QueryBuilder/CustomizableGroupByTag/GroupingDimensionCustomizationModule';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';
import type { IconType } from 'components/ui/Icon/types';

type Props = {
  /** The grouping item represented by this tag */
  item: GroupingItem,

  /** Callback for when this grouping item is customized */
  onItemCustomized: (newItem: GroupingItem) => void,

  /** Callback for when this tag is removed */
  onRemoveTagClick: (
    item: GroupingItem,
    event: SyntheticMouseEvent<HTMLSpanElement>,
  ) => void,

  /** Callback for when the customization module is closed */
  onRequestCloseCustomizationModule: () => void,

  /** Callback for when the tag is clicked */
  onTagClick: (item: GroupingItem) => void,
  showCustomizationModule: boolean,

  className?: string,
  showDragHandle?: boolean,
};

// HACK(stephen): Detect geo dimensions by looking at the backend provided list.
// This is now being done in two places and needs to move into the model!
const GEO_DIMENSION_IDS = window.__JSON_FROM_BACKEND.geoFieldOrdering;

export const GROUPING_TAG_ICONS = {
  dimension: undefined,
  geography: 'svg-globe',
  time: 'svg-calendar',
};

const TEXT = t('common.QueryBuilder.CustomizableGroupByTag');

function buildTagName(item: GroupingItem): string {
  return item.get('name');
}

function getDragIcon(item: GroupingItem): IconType | void {
  if (
    item.tag === 'GROUPING_DIMENSION' &&
    GEO_DIMENSION_IDS.includes(item.dimension())
  ) {
    return GROUPING_TAG_ICONS.geography;
  }

  if (item.tag === 'GROUPING_GRANULARITY') {
    return GROUPING_TAG_ICONS.time;
  }

  return GROUPING_TAG_ICONS.dimension;
}

function CustomizableGroupByTag({
  item,
  onItemCustomized,
  onRemoveTagClick,
  onRequestCloseCustomizationModule,
  onTagClick,
  showCustomizationModule,

  className = '',
  showDragHandle = true,
}: Props) {
  const renderCustomizationModule = React.useCallback(() => {
    if (item.tag === 'GROUPING_DIMENSION') {
      return (
        <GroupingDimensionCustomizationModule
          itemToCustomize={item}
          onItemCustomized={onItemCustomized}
        />
      );
    }

    if (item.tag === 'GROUPING_GRANULARITY') {
      return (
        <GranularityCustomizationModule
          itemToCustomize={item}
          onItemCustomized={onItemCustomized}
        />
      );
    }

    // TODO(stephen): Figure out error handling.
    throw new Error('Illegal customization item type.');
  }, [item, onItemCustomized]);

  return (
    <CustomizableTag
      className={className}
      customizationModuleARIAName={TEXT.title}
      dragIconType={getDragIcon(item)}
      item={item}
      onCloseCustomizationModuleClick={onRequestCloseCustomizationModule}
      onRemoveTagClick={onRemoveTagClick}
      onTagClick={onTagClick}
      renderCustomizationModule={renderCustomizationModule}
      showCustomizationModule={showCustomizationModule}
      showDragHandle={showDragHandle}
      tagName={buildTagName(item)}
    />
  );
}

export default (React.memo(
  CustomizableGroupByTag,
): React.AbstractComponent<Props>);
