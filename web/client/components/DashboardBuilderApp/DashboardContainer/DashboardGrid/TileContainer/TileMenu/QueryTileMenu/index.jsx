// @flow
import * as React from 'react';

import DirectoryService from 'services/DirectoryService';
import I18N from 'lib/I18N';
import ShareQueryTileModal from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/TileMenu/QueryTileMenu/ShareQueryTileModal';
import TileMenu from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/TileMenu';
import useBoolean from 'lib/hooks/useBoolean';
import useCanViewQueryForm from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/TileMenu/QueryTileMenu/useCanViewQueryForm';
import type DashboardQueryItem from 'models/DashboardBuilderApp/DashboardItem/DashboardQueryItem';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type Props = {
  dashboardFilterItems: $ReadOnlyArray<QueryFilterItem>,
  dashboardGroupingItems: $ReadOnlyArray<GroupingItem>,
  item: DashboardQueryItem,
  legacy: boolean,
  onCloneItem: () => void,
  onDeleteItem: () => void,
  onEditItem: () => void,
  onPlayItem: () => void,
};

/**
 * Wrapper around the TileMenu for the QueryTile component
 */
function QueryTileMenu({
  dashboardFilterItems,
  dashboardGroupingItems,
  item,
  legacy,
  onCloneItem,
  onDeleteItem,
  onEditItem,
  onPlayItem,
}: Props) {
  const [
    showShareQueryModal,
    openShareQueryModel,
    closeShareQueryModal,
  ] = useBoolean(false);

  const [
    isAuthorizedForSharing,
    setisAuthorizedForSharing,
  ] = React.useState<boolean>(false);

  // Api call to determine if user is authorized for data download.
  React.useEffect(() => {
    DirectoryService.canUserExportData(
      DirectoryService.getActiveUsername(),
    ).then(isAuthorized => setisAuthorizedForSharing(isAuthorized));
  }, []);

  const canViewQueryForm = useCanViewQueryForm();

  const onEditQueryItem = canViewQueryForm ? onEditItem : undefined;

  const shareQueryMenuOption = {
    iconType: 'share',
    onClick: openShareQueryModel,
    text: I18N.textById('Share'),
  };

  const additionalMenuOptions = isAuthorizedForSharing
    ? [shareQueryMenuOption]
    : undefined;

  return (
    <React.Fragment>
      <TileMenu
        additionalMenuOptions={additionalMenuOptions}
        legacy={legacy}
        onCloneItem={onCloneItem}
        onDeleteItem={onDeleteItem}
        onEditItem={onEditQueryItem}
        onPlayItem={onPlayItem}
      />
      <ShareQueryTileModal
        dashboardFilterItems={dashboardFilterItems}
        dashboardGroupingItems={dashboardGroupingItems}
        item={item}
        onCloseModal={closeShareQueryModal}
        show={showShareQueryModal}
      />
    </React.Fragment>
  );
}

export default (React.memo(QueryTileMenu): React.AbstractComponent<Props>);
