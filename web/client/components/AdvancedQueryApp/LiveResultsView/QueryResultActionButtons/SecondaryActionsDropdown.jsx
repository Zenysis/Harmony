// @flow
import * as React from 'react';

import DashboardPickerModal from 'components/common/DashboardPickerModal';
import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import ShareQueryModal from 'components/common/SharingUtil/ShareQueryModal';
import VisualizationPickerContext from 'components/AdvancedQueryApp/VisualizationPickerContext';
import useBoolean from 'lib/hooks/useBoolean';
import useSaveAQTQueryToDashboardModal from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/useSaveAQTQueryToDashboardModal';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

type Props = {
  disableOptions: boolean,
  querySelections: QuerySelections,
  queryResultSpec: QueryResultSpec | void,
  showSaveQueryOption: boolean,
  showShareQueryOption: boolean,
  viewType: ResultViewType,
  visualizationType: VisualizationType | void,
};

/**
 * In some cases, the "Share Query" and "Save To Dashboard" options should
 * render in a dropdown instead of as separate buttons. This happens, for
 * example, when the user is on AQT via the Dashboard's Edit Query flow.
 */
export default function SecondaryActionsDropdown({
  disableOptions,
  querySelections,
  queryResultSpec,
  showSaveQueryOption,
  showShareQueryOption,
  viewType,
  visualizationType,
}: Props): React.Node {
  const { displayedVisualizationType } = React.useContext(
    VisualizationPickerContext,
  );
  const [
    isShareQueryModalOpen,
    openShareQueryModal,
    closeShareQueryModal,
  ] = useBoolean(false);

  const [
    isSaveToDashboardModalOpen,
    closeSaveToDashboardModal,
    openSaveToDashboardModal,
    saveQueryToDashboard,
    navigateToDashboard,
    dashboards,
  ] = useSaveAQTQueryToDashboardModal(
    queryResultSpec,
    querySelections,
    visualizationType,
  );

  const onOptionClick = React.useCallback(
    option => {
      if (option === 'share') {
        openShareQueryModal();
        return;
      }
      if (option === 'add-to-dashboard') {
        openSaveToDashboardModal();
        return;
      }
      throw new Error('Invalid option selected');
    },
    [openShareQueryModal, openSaveToDashboardModal],
  );

  const dropdownIcon = (
    <Icon
      type="option-horizontal"
      className="aqt-query-result-action-buttons__secondary-actions-dropdown-icon"
    />
  );

  const shareQueryOption = showShareQueryOption ? (
    <Dropdown.Option value="share" unselectable={disableOptions}>
      <I18N>Share</I18N>
    </Dropdown.Option>
  ) : null;

  const saveQueryOption = showSaveQueryOption ? (
    <Dropdown.Option value="add-to-dashboard" unselectable={disableOptions}>
      <I18N>Add to dashboard</I18N>
    </Dropdown.Option>
  ) : null;

  const onRequestSave = React.useCallback(
    (dashboardName, dashboard) => {
      saveQueryToDashboard(dashboardName, dashboard);
    },
    [saveQueryToDashboard],
  );

  return (
    <>
      <Dropdown.Uncontrolled
        hideCaret
        buttonIntent="plain"
        initialValue={undefined}
        displayCurrentSelection={false}
        defaultDisplayContent={dropdownIcon}
        onSelectionChange={onOptionClick}
      >
        {shareQueryOption}
        {saveQueryOption}
      </Dropdown.Uncontrolled>
      <ShareQueryModal
        show={isShareQueryModalOpen}
        viewType={viewType}
        visualizationType={displayedVisualizationType}
        onRequestClose={closeShareQueryModal}
        queryResultSpec={queryResultSpec}
        querySelections={querySelections}
      />
      <DashboardPickerModal
        show={isSaveToDashboardModalOpen}
        dashboards={dashboards}
        onRequestClose={closeSaveToDashboardModal}
        onSubmitDashboardSelection={onRequestSave}
        onRequestNavigate={navigateToDashboard}
      />
    </>
  );
}
