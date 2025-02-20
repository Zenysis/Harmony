// @flow
import * as React from 'react';

import EditItemView from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/EditItemView';
import PlaceholderQueryEditView from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/EditItemView/PlaceholderQueryEditView';
import type DashboardPlaceholderItem from 'models/DashboardBuilderApp/DashboardItem/DashboardPlaceholderItem';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';
import type { TilePosition } from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';

type Props = {
  cellsPerRow: number,

  /**
   * extracted filters to apply to the display custom values in
   * the text box
   */
  extractedFilterItems: $ReadOnlyArray<QueryFilterItem>,

  initialItem: DashboardPlaceholderItem,
  legacy: boolean,
  onItemChange: $ElementType<
    React.ElementConfig<typeof EditItemView>,
    'onItemChange',
  >,
  onRequestClose: () => void,
  position: TilePosition,
  scaleFactor: number,
  tileContainerId: string,
};

/**
 * The PlaceholderEditView presents a full edit experience for the type of item
 * the placeholder represents (i.e. query, text or iframe).
 */
function PlaceholderEditView({
  cellsPerRow,
  extractedFilterItems,
  initialItem,
  legacy,
  onItemChange,
  onRequestClose,
  position,
  scaleFactor = 1,
  tileContainerId,
}: Props) {
  // NOTE: We have a special case for placeholder query items as we
  // cannot create an empty DashboardQueryItem because it requires a defined
  // QueryResultSpec (which requires at least one selected field)
  if (initialItem.itemType() === 'query') {
    return (
      <PlaceholderQueryEditView
        onRequestClose={onRequestClose}
        onSaveClick={onItemChange}
      />
    );
  }

  // Create the initial non-placeholder item.
  const initialConcreteItem = initialItem.createEmptyItem();

  return (
    <EditItemView
      cellsPerRow={cellsPerRow}
      extractedFilterItems={extractedFilterItems}
      initialItem={initialConcreteItem}
      legacy={legacy}
      onItemChange={onItemChange}
      onRequestClose={onRequestClose}
      position={position}
      scaleFactor={scaleFactor}
      tileContainerId={tileContainerId}
    />
  );
}

export default (React.memo(
  PlaceholderEditView,
): React.AbstractComponent<Props>);
