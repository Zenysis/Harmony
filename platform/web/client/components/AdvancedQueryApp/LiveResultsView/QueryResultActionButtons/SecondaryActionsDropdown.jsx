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
  queryResultSpec: QueryResultSpec | void,
  querySelections: QuerySelections,
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
  queryResultSpec,
  querySelections,
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
      className="aqt-query-result-action-buttons__secondary-actions-dropdown-icon"
      type="option-horizontal"
    />
  );

  const shareQueryOption = showShareQueryOption ? (
    <Dropdown.Option unselectable={disableOptions} value="share">
      <I18N>Share</I18N>
    </Dropdown.Option>
  ) : null;

  const saveQueryOption = showSaveQueryOption ? (
    <Dropdown.Option unselectable={disableOptions} value="add-to-dashboard">
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
        buttonIntent="plain"
        defaultDisplayContent={dropdownIcon}
        displayCurrentSelection={false}
        hideCaret
        initialValue={undefined}
        onSelectionChange={onOptionClick}
      >
        {shareQueryOption}
        {saveQueryOption}
      </Dropdown.Uncontrolled>
      <ShareQueryModal
        onRequestClose={closeShareQueryModal}
        queryResultSpec={queryResultSpec}
        querySelections={querySelections}
        show={isShareQueryModalOpen}
        viewType={viewType}
        visualizationType={displayedVisualizationType}
      />
      <DashboardPickerModal
        dashboards={dashboards}
        onRequestClose={closeSaveToDashboardModal}
        onRequestNavigate={navigateToDashboard}
        onSubmitDashboardSelection={onRequestSave}
        show={isSaveToDashboardModalOpen}
      />
    </>
  );
}
