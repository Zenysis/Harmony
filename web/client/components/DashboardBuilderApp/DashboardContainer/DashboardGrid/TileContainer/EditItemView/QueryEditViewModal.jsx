// @flow
import * as React from 'react';

import AdvancedQueryApp from 'components/AdvancedQueryApp';
import DashboardQueryItem from 'models/DashboardBuilderApp/DashboardItem/DashboardQueryItem';
import FullscreenEditContainer from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/EditItemView/FullscreenEditContainer';
import I18N from 'lib/I18N';
import type QueryTabItem from 'models/AdvancedQueryApp/QueryTabItem';

type Props = {
  initialQueryTabItem: QueryTabItem,
  onRequestClose: () => void,
  onSaveClick: DashboardQueryItem => void,
};

/**
 * This is the edit view for a query tile. It will provide the user a full query
 * tool experience where they can modify query selections, change viz settings,
 * and more. It is used for both DashbordQueryItems and
 * DashboardPlaceholderItems of type 'query'.
 */
function QueryEditViewModal({
  initialQueryTabItem,
  onRequestClose,
  onSaveClick,
}: Props) {
  const [queryTabItem, setQueryTabItem] = React.useState<QueryTabItem>(
    initialQueryTabItem,
  );

  const onAQTTabsChange = React.useCallback(
    newTabs => setQueryTabItem(newTabs.first()),
    [],
  );

  const onSaveQueryItemClick = React.useCallback(() => {
    const queryResultSpec = queryTabItem.queryResultSpec();
    const querySelections = queryTabItem.querySelections();
    const visualizationType = queryTabItem.visualizationType();

    // The save button will be disabled when any of these cases are true.
    if (
      querySelections.fields().isEmpty() ||
      queryResultSpec === undefined ||
      visualizationType === undefined
    ) {
      return;
    }

    const newItem = DashboardQueryItem.create({
      queryResultSpec,
      querySelections,
      visualizationType,
    });
    onSaveClick(newItem);
  }, [queryTabItem, onSaveClick]);

  const disableSave =
    queryTabItem
      .querySelections()
      .fields()
      .isEmpty() ||
    queryTabItem.queryResultSpec() === undefined ||
    queryTabItem.visualizationType() === undefined;

  return (
    <FullscreenEditContainer
      disableSave={disableSave}
      onRequestClose={onRequestClose}
      onSaveClick={onSaveQueryItemClick}
      title={I18N.text('Editing visualization')}
    >
      <AdvancedQueryApp
        showSecondaryActionButtonsAsMenu
        enableTabs={false}
        initialTab={queryTabItem}
        onTabsChange={onAQTTabsChange}
      />
    </FullscreenEditContainer>
  );
}

export default (React.memo(QueryEditViewModal): React.AbstractComponent<Props>);
