// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import DashboardPickerModal from 'components/common/DashboardPickerModal';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import QueryResultSpec from 'models/core/QueryResultSpec';
import QuerySelections from 'models/core/wip/QuerySelections';
import useSaveAQTQueryToDashboardModal from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/useSaveAQTQueryToDashboardModal';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

type Props = {
  /** Whether this button is disabled or not */
  isDisabled?: boolean,
  queryResultSpec: QueryResultSpec | void,
  querySelections: QuerySelections,
  smallMode?: boolean,
  visualizationType: VisualizationType | void,
};

export default function SaveQueryButton({
  isDisabled = false,
  queryResultSpec,
  querySelections,
  smallMode = false,
  visualizationType,
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
  };

  const size = smallMode ? Button.Sizes.SMALL : Button.Sizes.MEDIUM;

  const onRequestSaveToDashboard = (dashboardName, dashboard) => {
    saveToDashboard(dashboardName, dashboard);
  };

  return (
    <div className="aqt-query-result-action-buttons__secondary-buttons--button">
      <Button
        disabled={isDisabled}
        intent={Button.Intents.PRIMARY}
        onClick={onSaveButtonClick}
        size={size}
        testId="save-query-button"
      >
        <Icon type="plus" /> <I18N.Ref id="Add to dashboard" />
      </Button>
      <DashboardPickerModal
        dashboards={dashboards}
        onRequestClose={closeModal}
        onRequestNavigate={navigateToDashboardFn}
        onSubmitDashboardSelection={onRequestSaveToDashboard}
        show={isModalOpen}
      />
    </div>
  );
}
