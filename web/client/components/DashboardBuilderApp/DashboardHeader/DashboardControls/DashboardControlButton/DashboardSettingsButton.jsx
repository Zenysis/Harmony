// @flow
import * as React from 'react';

import DashboardControlButton from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton';
import DashboardSettingsModal from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal';
import I18N from 'lib/I18N';
import useBoolean from 'lib/hooks/useBoolean';
import type Dashboard from 'models/core/Dashboard';

type Props = {
  dashboard: Dashboard,
  onSaveDashboard: Dashboard => void,
};

/**
 * The DashboardSettingsButton, when clicked, will open the
 * DashboardSettingsModal that dashboard administrators can use to change
 * properties of the dashboard.
 */
function DashboardSettingsButton({ dashboard, onSaveDashboard }: Props) {
  const [showModal, onShowModal, onHideModal] = useBoolean(false);
  return (
    <React.Fragment>
      <DashboardControlButton
        iconType="svg-settings-outline"
        onClick={onShowModal}
        testId="dashboard-settings-button"
        title={I18N.text('Settings')}
      />
      <DashboardSettingsModal
        initialDashboard={dashboard}
        onDashboardChange={onSaveDashboard}
        onRequestClose={onHideModal}
        show={showModal}
      />
    </React.Fragment>
  );
}

export default (React.memo(
  DashboardSettingsButton,
): React.AbstractComponent<Props>);
