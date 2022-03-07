// @flow
import * as React from 'react';

import QueryEditViewModal from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/EditItemView/QueryEditViewModal';
import QueryTabItem from 'models/AdvancedQueryApp/QueryTabItem';
import { VISUALIZATION_TO_VIEW_TYPE } from 'models/AdvancedQueryApp/VisualizationType/registry';
import type DashboardQueryItem from 'models/DashboardBuilderApp/DashboardItem/DashboardQueryItem';

type Props = {
  initialItem: DashboardQueryItem,
  onRequestClose: () => void,
  onSaveClick: DashboardQueryItem => void,
};

function buildQueryTabItemFromDashboardQueryItem(
  item: DashboardQueryItem,
): QueryTabItem {
  const visualizationType = item.visualizationType();
  return QueryTabItem.create({
    id: '',
    name: '',
    queryResultSpec: item.queryResultSpec(),
    querySelections: item.querySelections(),
    viewType: VISUALIZATION_TO_VIEW_TYPE[visualizationType],
    visualizationType,
  });
}

/**
 * Edit view for a DashboardQueryItem
 */
function QueryEditView({ initialItem, onRequestClose, onSaveClick }: Props) {
  const initialQueryTabItem = buildQueryTabItemFromDashboardQueryItem(
    initialItem,
  );

  return (
    <QueryEditViewModal
      initialQueryTabItem={initialQueryTabItem}
      onRequestClose={onRequestClose}
      onSaveClick={onSaveClick}
    />
  );
}

export default (React.memo(QueryEditView): React.AbstractComponent<Props>);
