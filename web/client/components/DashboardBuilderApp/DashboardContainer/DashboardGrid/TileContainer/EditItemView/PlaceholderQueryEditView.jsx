// @flow

import * as React from 'react';

import * as Zen from 'lib/Zen';
import DashboardQueryItem from 'models/DashboardBuilderApp/DashboardItem/DashboardQueryItem';
import QueryEditViewModal from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/EditItemView/QueryEditViewModal';
import QuerySelections from 'models/core/wip/QuerySelections';
import QueryTabItem from 'models/AdvancedQueryApp/QueryTabItem';

type Props = {
  onRequestClose: () => void,
  onSaveClick: DashboardQueryItem => void,
};

/**
 * The edit view for a Placeholder query item that is being transformed into a
 * a full DashboardQueryItem
 */
function PlaceholderQueryEditView({ onRequestClose, onSaveClick }: Props) {
  const initialQueryTabItem = QueryTabItem.create({
    id: '',
    name: '',

    querySelections: QuerySelections.create({
      fields: Zen.Array.create(),
      groups: Zen.Array.create(),
      filter: Zen.Array.create(),
    }),
    visualizationType: 'TABLE',
    viewType: 'TABLE',
  });

  return (
    <QueryEditViewModal
      initialQueryTabItem={initialQueryTabItem}
      onRequestClose={onRequestClose}
      onSaveClick={onSaveClick}
    />
  );
}

export default (React.memo(
  PlaceholderQueryEditView,
): React.AbstractComponent<Props>);
