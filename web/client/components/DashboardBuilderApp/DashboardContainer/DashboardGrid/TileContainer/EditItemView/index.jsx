// @flow
import * as React from 'react';

import GISEditView from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/EditItemView/GISEditView';
import IFrameEditView from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/EditItemView/IFrameEditView';
import QueryEditView from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/EditItemView/QueryEditView';
import TextEditView from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/EditItemView/TextEditView';
import type DashboardGISItem from 'models/DashboardBuilderApp/DashboardItem/DashboardGISItem';
import type DashboardIFrameItem from 'models/DashboardBuilderApp/DashboardItem/DashboardIFrameItem';
import type DashboardQueryItem from 'models/DashboardBuilderApp/DashboardItem/DashboardQueryItem';
import type DashboardTextItem from 'models/DashboardBuilderApp/DashboardItem/DashboardTextItem';
import type { TilePosition } from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';

type EditableItemType =
  | DashboardGISItem
  | DashboardIFrameItem
  | DashboardQueryItem
  | DashboardTextItem;

type Props = {
  cellsPerRow: number,
  initialItem: EditableItemType,
  legacy: boolean,
  onItemChange: EditableItemType => void,
  onRequestClose: () => void,
  position: TilePosition,
  scaleFactor: number,
  tileContainerId: string,
};

/**
 * The EditItemView shows the custom tile editing experience for the current
 * dashboard item.
 */
function EditItemView({
  cellsPerRow,
  initialItem,
  legacy,
  onItemChange,
  onRequestClose,
  position,
  scaleFactor,
  tileContainerId,
}: Props) {
  switch (initialItem.tag) {
    case 'GIS_ITEM':
      return (
        <GISEditView
          initialItem={initialItem}
          onRequestClose={onRequestClose}
          onSaveClick={onItemChange}
        />
      );
    case 'IFRAME_ITEM':
      return (
        <IFrameEditView
          initialItem={initialItem}
          onRequestClose={onRequestClose}
          onSaveClick={onItemChange}
        />
      );
    case 'QUERY_ITEM':
      return (
        <QueryEditView
          initialItem={initialItem}
          onRequestClose={onRequestClose}
          onSaveClick={onItemChange}
        />
      );
    case 'TEXT_ITEM':
      return (
        <TextEditView
          cellsPerRow={cellsPerRow}
          initialItem={initialItem}
          legacy={legacy}
          onRequestClose={onRequestClose}
          onSaveClick={onItemChange}
          position={position}
          scaleFactor={scaleFactor}
          tileContainerId={tileContainerId}
        />
      );
    default:
      (initialItem.tag: empty);
      return null;
  }
}

export default (React.memo(EditItemView): React.AbstractComponent<Props>);
