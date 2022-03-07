// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import DashboardPickerModal from 'components/common/DashboardPickerModal';
import Icon from 'components/ui/Icon';
import QueryResultSpec from 'models/core/QueryResultSpec';
import QuerySelections from 'models/core/wip/QuerySelections';
import useSaveAQTQueryToDashboardModal from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/useSaveAQTQueryToDashboardModal';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

type Props = {
  queryResultSpec: QueryResultSpec | void,
  querySelections: QuerySelections,
  visualizationType: VisualizationType | void,

  /** Whether this button is disabled or not */
  isDisabled?: boolean,
  smallMode?: boolean,
};

const TEXT = t('process_query');

export default function SaveQueryButton({
  queryResultSpec,
  querySelections,
  visualizationType,
  isDisabled = false,
  smallMode = false,
}: Props): React.Element<'div'> {
  const [
    isModalOpen,
    closeModal,
    openModal,
    saveToDashboard,
    navigateToDashboardFn,
    dashboards,
  ] = useSaveAQTQueryToDashboardModal(
    queryResultSpec,
    querySelections,
    visualizationType,
  );

  const onSaveButtonClick = () => {
    openModal();
    analytics.track('Click save query button');
  };

  const size = smallMode ? Button.Sizes.SMALL : Button.Sizes.MEDIUM;

  const onRequestSaveToDashboard = (dashboardName, dashboard) => {
    saveToDashboard(dashboardName, dashboard);
  };

  return (
    <div className="aqt-query-result-action-buttons__secondary-buttons--button">
      <Button
        disabled={isDisabled}
        size={size}
        intent={Button.Intents.PRIMARY}
        onClick={onSaveButtonClick}
        testId="save-query-button"
      >
        <Icon type="plus" /> {TEXT.save}
      </Button>
      <DashboardPickerModal
        show={isModalOpen}
        dashboards={dashboards}
        onRequestClose={closeModal}
        onSubmitDashboardSelection={onRequestSaveToDashboard}
        onRequestNavigate={navigateToDashboardFn}
      />
    </div>
  );
}
