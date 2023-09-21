// @flow
import * as React from 'react';

import TileMenu from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/TileMenu';
import useCanViewQueryForm from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/TileMenu/QueryTileMenu/useCanViewQueryForm';
import type DashboardPlaceholderItem from 'models/DashboardBuilderApp/DashboardItem/DashboardPlaceholderItem';

type Props = {
  item: DashboardPlaceholderItem,
  legacy: boolean,
  onCloneItem: () => void,
  onDeleteItem: () => void,
  onEditItem: void | (() => void),
};

/**
 * Wrapper around the TileMenu for the PlaceholderTile component
 */
function PlaceholderTileMenu({
  item,
  legacy,
  onCloneItem,
  onDeleteItem,
  onEditItem,
}: Props) {
  const canViewQueryForm = useCanViewQueryForm();
  const onEditPlaceholderItem =
    item.itemType() !== 'query' || canViewQueryForm ? onEditItem : undefined;

  return (
    <TileMenu
      legacy={legacy}
      onCloneItem={onCloneItem}
      onDeleteItem={onDeleteItem}
      onEditItem={onEditPlaceholderItem}
      onPlayItem={undefined}
    />
  );
}

export default (React.memo(
  PlaceholderTileMenu,
): React.AbstractComponent<Props>);
