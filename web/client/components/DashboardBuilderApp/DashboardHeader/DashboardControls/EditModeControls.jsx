// @flow
import * as React from 'react';

import AddTileButton from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton/AddTileButton';
import DashboardControlButton from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton';
import DashboardSaveButton from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton/DashboardSaveButton';
import DashboardSettingsButton from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton/DashboardSettingsButton';
import DashboardShareButton from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton/DashboardShareButton';
import DashboardUndoButton from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton/DashboardUndoButton';
import DashboardZoomLevelButton from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton/DashboardZoomLevelButton';
import EditPresentToggle from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/EditPresentToggle';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import NonAdminControlsDropdown from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/NonAdminControlsDropdown';
import addDividerTileToDashboard from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/util/addDividerTileToDashboard';
import addPlaceholderTileToDashboard from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/util/addPlaceholderTileToDashboard';
import addSpacerTileToDashboard from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/util/addSpacerTileToDashboard';
import { FullscreenTileContext } from 'components/DashboardBuilderApp/hooks/useFullscreenTileContext';
import { registerUnloadHandler, removeUnloadHandler } from 'util/util';
import type Dashboard from 'models/core/Dashboard';
import type { PlaceholderItemType } from 'models/DashboardBuilderApp/DashboardItem/DashboardPlaceholderItem';
import type { ZoomSetting } from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton/DashboardZoomLevelButton';

type Props = {
  /** Whether user has permissions to share  */
  authorizedForSharing: boolean,

  /** Dashboard currently being viewed */
  currentDashboard: Dashboard,

  /** Does the current user have admin permissions for this dashboard? */
  isAdministrator: boolean,

  // NOTE(david): It's super annoying that we need to have an isEditor flag
  // inside controls that are only shown in edit mode. The reason is because
  // KVAP dashbaord viewers are allowed to edit, but not save, their dashboards.
  /** Does the current user have admin permissions for this dashboard? */
  isEditor: boolean,

  /** Spec for the last version of the Dashboard that was saved */
  lastSavedDashboard: Dashboard,

  /** Callback to modify Dashboard. */
  onDashboardChange: Dashboard => void,

  /** Callback to save latest changes on Dashboard. */
  onSaveDashboard: Dashboard => void,

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
 * The EditModeControls component renders all the buttons and toggles that the
 * user can interact with to change the settings of the dashboard when in Edit
 * mode. Depending on the user's permissions, some buttons will not be visible.
 */
function EditModeControls({
  authorizedForSharing,
  currentDashboard,
  isAdministrator,
  isEditor,
  lastSavedDashboard,
  onDashboardChange,
  onSaveDashboard,
  onTogglePresentingMode,
  onZoomSettingChange,
  presenting,
  zoomSetting,
}: Props): React.Node {
  const {
    sortedFullscreenItems: fullscreenItems,
    startFullscreenPlayMode,
  } = React.useContext(FullscreenTileContext);

  const hasUnsavedChanges = currentDashboard !== lastSavedDashboard;

  // Register unload handler when there are unsaved changes. Remove it when
  // there are no unsaved changes pending.
  const shouldRegisterUnloadHandler =
    hasUnsavedChanges && onSaveDashboard !== undefined;
  React.useEffect(() => {
    if (shouldRegisterUnloadHandler) {
      registerUnloadHandler();
    }

    return removeUnloadHandler;
  }, [shouldRegisterUnloadHandler]);

  // Callback to revert to the last saved dashboard state
  const onUndoClick = React.useCallback(() => {
    onDashboardChange(lastSavedDashboard);
  }, [lastSavedDashboard, onDashboardChange]);

  // Callback to save changes to Dashboard
  const onSaveClick = React.useCallback(() => {
    if (onSaveDashboard !== undefined) {
      onSaveDashboard(currentDashboard);
    }
  }, [currentDashboard, onSaveDashboard]);

  const onAddTile = React.useCallback(
    (tileType: PlaceholderItemType | 'spacer' | 'divider') => {
      if (tileType === 'spacer') {
        onDashboardChange(addSpacerTileToDashboard(currentDashboard));
      } else if (tileType === 'divider') {
        onDashboardChange(addDividerTileToDashboard(currentDashboard));
      } else {
        onDashboardChange(
          addPlaceholderTileToDashboard(currentDashboard, tileType),
        );
      }
    },
    [currentDashboard, onDashboardChange],
  );

  const legacy = currentDashboard.specification().legacy();
  return (
    <Group.Horizontal alignItems="center" flex spacing="m">
      <div className="gd-dashboard-controls">
        {isEditor && (
          <DashboardSaveButton
            hasUnsavedChanges={hasUnsavedChanges}
            onClick={onSaveClick}
          />
        )}
        <DashboardUndoButton
          hasUnsavedChanges={hasUnsavedChanges}
          onClick={onUndoClick}
        />
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
        <AddTileButton enableSpacers={!legacy} onAddTile={onAddTile} />
        {!legacy && (
          <DashboardZoomLevelButton
            onZoomSettingChange={onZoomSettingChange}
            zoomSetting={zoomSetting}
          />
        )}
        {isAdministrator && (
          <DashboardSettingsButton
            dashboard={currentDashboard}
            onSaveDashboard={onSaveDashboard}
          />
        )}
        {!isAdministrator && (
          <NonAdminControlsDropdown dashboard={currentDashboard} />
        )}
      </div>
      <EditPresentToggle
        onTogglePresentingMode={onTogglePresentingMode}
        presenting={presenting}
      />
    </Group.Horizontal>
  );
}

export default (React.memo(EditModeControls): React.AbstractComponent<Props>);
