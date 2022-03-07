// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';
import invariant from 'invariant';

import DashboardContainer from 'components/DashboardBuilderApp/DashboardContainer';
import DashboardHeader from 'components/DashboardBuilderApp/DashboardHeader';
import ProgressBar from 'components/ui/ProgressBar';
import Spacing from 'components/ui/Spacing';
import useAugmentedDashboard from 'components/DashboardBuilderApp/hooks/useAugmentedDashboard';
import useDashboardAuthorization from 'components/DashboardBuilderApp/hooks/useDashboardAuthorization';
import useSavedDashboard from 'components/DashboardBuilderApp/hooks/useSavedDashboard';
import useScreenSizeDependentState from 'components/DashboardBuilderApp/hooks/useScreenSizeDependentState';
import useStoreUnsavedChangesOnTimeout from 'components/DashboardBuilderApp/hooks/useStoreUnsavedChangesOnTimeout';
import useFullscreenTileContext, {
  FullscreenTileContext,
} from 'components/DashboardBuilderApp/hooks/useFullscreenTileContext';
import type { ZoomSetting } from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton/DashboardZoomLevelButton';

type Props = {};

// TODO(david, nina): Consider extracting these to a service call.
const BACKEND_DASHBOARD_OPTIONS = window.__JSON_FROM_BACKEND.dashboard;
const DASHBOARD_URI: string = BACKEND_DASHBOARD_OPTIONS.dashboardUri;
const DASHBOARD_SLUG: string = BACKEND_DASHBOARD_OPTIONS.activeDashboard;

const ALLOW_EDIT_WITHOUT_SAVE_PERMISSION: boolean = false;

export function renderToDOM(elementId?: string = 'app'): void {
  const elt: ?HTMLElement = document.getElementById(elementId);
  invariant(elt, `Element ID does not exist: ${elementId}`);
  ReactDOM.render(<DashboardBuilderApp />, elt);
}

/**
 * The DashboardBuilder app is use to render dashboards and enable editing of
 * those dashboards.
 */
function DashboardBuilderApp(): React.Node {
  const [collapse, screenTooSmall] = useScreenSizeDependentState();
  const [zoomSetting, setZoomLevel] = React.useState<ZoomSetting>('fit');
  const [lastSavedDashboard, onSaveDashboard, status] = useSavedDashboard(
    DASHBOARD_URI,
  );

  // Load in any unsaved changes to be applied on top of the saved dashboard
  const [currentDashboard, onDashboardChange] = useAugmentedDashboard(
    DASHBOARD_URI,
    lastSavedDashboard,
  );

  const fullscreenTileContext = useFullscreenTileContext(
    currentDashboard === undefined
      ? []
      : currentDashboard.specification().items(),
  );

  // If a session times out with unsaved changes we store those changes in local
  // storage and load them back in in useAugmentedDashboard.
  useStoreUnsavedChangesOnTimeout(currentDashboard, lastSavedDashboard);

  const [isAdministrator, isEditor] = useDashboardAuthorization(DASHBOARD_SLUG);

  // NOTE(david): This is a temporary segment event used to trigger the appcues
  // onboarding experience for the modern dashboard app.
  React.useEffect(() => {
    if (isEditor) {
      analytics.track('Editor/Admin Dashboard View');
    }
  }, [isEditor]);

  const [presenting, setPresenting] = React.useState(
    !isEditor && !isAdministrator && !ALLOW_EDIT_WITHOUT_SAVE_PERMISSION,
  );

  React.useEffect(() => {
    setPresenting(
      !isEditor && !isAdministrator && !ALLOW_EDIT_WITHOUT_SAVE_PERMISSION,
    );
  }, [isAdministrator, isEditor]);

  // NOTE(stephen): If the screen is too small, we should not render the
  // dashboard container at all. We should just render the loading bar and wait
  // for the user to resize the screen so that it is large enough to show the
  // dashboard.
  if (status === 'loading' || screenTooSmall) {
    return (
      <Spacing paddingTop="xxxl">
        <ProgressBar />
      </Spacing>
    );
  }

  if (status === 'error') {
    // TODO(david): Implement a full error page. For now we just show a blank
    // page. There is also a toast shown in the useSavedDashboard hook.
    return <div />;
  }

  invariant(
    currentDashboard && lastSavedDashboard,
    `currentDashboard and lastSavedDashboard should always exist when status is success`,
  );

  return (
    <div className="gd-dashboard-builder" data-testid="dashboard-builder-app">
      <FullscreenTileContext.Provider value={fullscreenTileContext}>
        <DashboardHeader
          collapse={collapse}
          currentDashboard={currentDashboard}
          lastSavedDashboard={lastSavedDashboard}
          isAdministrator={isAdministrator}
          isEditor={isEditor}
          onDashboardChange={onDashboardChange}
          onPresentingChange={setPresenting}
          onSaveDashboard={onSaveDashboard}
          onZoomSettingChange={setZoomLevel}
          presenting={presenting}
          zoomSetting={zoomSetting}
        />
        <DashboardContainer
          collapse={collapse}
          dashboard={currentDashboard}
          hasUnsavedChanges={currentDashboard !== lastSavedDashboard}
          onDashboardChange={onDashboardChange}
          presenting={presenting}
          zoomSetting={zoomSetting}
        />
      </FullscreenTileContext.Provider>
    </div>
  );
}

export default (React.memo(
  DashboardBuilderApp,
): React.AbstractComponent<Props>);
