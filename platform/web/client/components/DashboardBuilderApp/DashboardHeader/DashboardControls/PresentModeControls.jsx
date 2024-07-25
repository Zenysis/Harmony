// @flow
import * as React from 'react';

import DashboardControlButton from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton';
import DashboardShareButton from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton/DashboardShareButton';
import DashboardZoomLevelButton from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton/DashboardZoomLevelButton';
import EditPresentToggle from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/EditPresentToggle';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import NonAdminControlsDropdown from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/NonAdminControlsDropdown';
import { FullscreenTileContext } from 'components/DashboardBuilderApp/hooks/useFullscreenTileContext';
import type Dashboard from 'models/core/Dashboard';
import type { ZoomSetting } from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton/DashboardZoomLevelButton';

type Props = {
  /** Whether user has permissions to share  */
  authorizedForSharing: boolean,

  /** Dashboard currently being viewed */
  currentDashboard: Dashboard,

  /** Does the current user have admin permissions for this dashboard? */
  isAdministrator: boolean,

  /** Does the current user have edit permissions for this dashboard? */
  isEditor: boolean,

  /** Spec for the last version of the Dashboard that was saved */
  lastSavedDashboard: Dashboard,

  /** Callback to toggle between edit and present modes */
  onTogglePresentingMode: () => void,

  /** Callback to change the dashboard zoom setting */
  onZoomSettingChange: ZoomSetting => void,

  /** Flag if in present mode */
  presenting: boolean,

  /** Current dashboard zoom setting */
  zoomSetting: ZoomSetting,
};

/**
 * Dashboard controls that can be accessed by users in present mode.
 */
function PresentModeControls({
  authorizedForSharing,
  currentDashboard,
  isAdministrator,
  isEditor,
  lastSavedDashboard,
  onTogglePresentingMode,
  onZoomSettingChange,
  presenting,
  zoomSetting,
}: Props): React.Node {
  const {
    sortedFullscreenItems: fullscreenItems,
    startFullscreenPlayMode,
  } = React.useContext(FullscreenTileContext);

  const showPresentEditToggle = isEditor;

  return (
    <Group.Horizontal alignItems="center" flex spacing="m">
      <div className="gd-dashboard-controls">
        {fullscreenItems.length > 0 && (
          <DashboardControlButton
            iconType="play"
            onClick={startFullscreenPlayMode}
            title={I18N.textById('Play')}
          />
        )}
        {authorizedForSharing && (
          <DashboardShareButton
            currentDashboard={currentDashboard}
            lastSavedDashboard={lastSavedDashboard}
          />
        )}
        {!currentDashboard.specification().legacy() && (
          <DashboardZoomLevelButton
            onZoomSettingChange={onZoomSettingChange}
            zoomSetting={zoomSetting}
          />
        )}
        {!isAdministrator && (
          <NonAdminControlsDropdown dashboard={currentDashboard} />
        )}
      </div>
      {showPresentEditToggle && (
        <EditPresentToggle
          onTogglePresentingMode={onTogglePresentingMode}
          presenting={presenting}
        />
      )}
    </Group.Horizontal>
  );
}

export default (React.memo(
  PresentModeControls,
): React.AbstractComponent<Props>);
