// @flow
import * as React from 'react';
import classNames from 'classnames';

import DirectoryService from 'services/DirectoryService';
import EditModeControls from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/EditModeControls';
import Heading from 'components/ui/Heading';
import LegacyExperienceControls from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/LegacyExperienceControls';
import PresentModeControls from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/PresentModeControls';
import { IS_LEGACY_EXPERIENCE } from 'components/DashboardBuilderApp/constants';
import type Dashboard from 'models/core/Dashboard';
import type { ZoomSetting } from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton/DashboardZoomLevelButton';

type Props = {
  /** Flag for if layout is in collapsed mode */
  collapse: boolean,

  /** Dashboard currently being viewed */
  currentDashboard: Dashboard,

  /** Does the current user have admin permissions for this dashboard? */
  isAdministrator: boolean,

  /** Does the current user have edit permissions for this dashboard? */
  isEditor: boolean,

  /** Spec for the last version of the Dashboard that was saved */
  lastSavedDashboard: Dashboard,

  /** Callback to modify Dashboard. */
  onDashboardChange: Dashboard => void,

  /** Callback to switch Dashboard between editing and read-only. */
  onPresentingChange: boolean => void,

  /** Callback to save latest changes on Dashboard. */
  onSaveDashboard: Dashboard => void,

  /** Callback to change the dashboard zoom setting */
  onZoomSettingChange: ZoomSetting => void,

  /** Flag if in present mode */
  presenting: boolean,

  /** Current dashboard zoom setting */
  zoomSetting: ZoomSetting,
};

/**
 * The DashboardHeader renders the header top bar to the page with a few buttons
 * and controls for working with the dashboard.
 *
 * NOTE(stephen, nina): The DashboardHeader primarily uses the legacy dashboard
 * models because it also relies on some of the GridDashboardControls
 * components to share functionality.
 */
export default function DashboardHeader({
  collapse,
  currentDashboard,
  isAdministrator,
  isEditor,
  lastSavedDashboard,
  onDashboardChange,
  onPresentingChange,
  onSaveDashboard,
  onZoomSettingChange,
  presenting,
  zoomSetting,
}: Props): React.Node {
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

  // Callback to toggle whether Dashboard is in present mode
  const onTogglePresentingMode = React.useCallback(() => {
    onPresentingChange(!presenting);
  }, [onPresentingChange, presenting]);

  const maybeRenderControls = () => {
    if (collapse) {
      return null;
    }

    // HACK(stephen): When the user is in the legacy dashboard viewing
    // experience, they should not be able to do anything except view the
    // dashboard and stare at a warning message.
    if (IS_LEGACY_EXPERIENCE) {
      return <LegacyExperienceControls />;
    }

    if (presenting) {
      return (
        <PresentModeControls
          authorizedForSharing={isAuthorizedForSharing}
          currentDashboard={currentDashboard}
          isAdministrator={isAdministrator}
          isEditor={isEditor}
          lastSavedDashboard={lastSavedDashboard}
          onTogglePresentingMode={onTogglePresentingMode}
          onZoomSettingChange={onZoomSettingChange}
          presenting={presenting}
          zoomSetting={zoomSetting}
        />
      );
    }

    return (
      <EditModeControls
        authorizedForSharing={isAuthorizedForSharing}
        currentDashboard={currentDashboard}
        isAdministrator={isAdministrator}
        isEditor={isEditor}
        lastSavedDashboard={lastSavedDashboard}
        onDashboardChange={onDashboardChange}
        onSaveDashboard={onSaveDashboard}
        onTogglePresentingMode={onTogglePresentingMode}
        onZoomSettingChange={onZoomSettingChange}
        presenting={presenting}
        zoomSetting={zoomSetting}
      />
    );
  };

  const className = classNames('gd-dashboard-header', {
    'gd-dashboard-header--collapsed-layout': collapse,
  });

  return (
    <div className={className}>
      <Heading className="gd-dashboard-header__title" size="small">
        <span data-testid="grid-dashboard-title">
          {currentDashboard
            .specification()
            .dashboardOptions()
            .title()}
        </span>
      </Heading>
      <div className="gd-dashboard-header__controls">
        {maybeRenderControls()}
      </div>
    </div>
  );
}
