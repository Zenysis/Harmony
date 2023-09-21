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
import useFullscreenTileContext, {
  FullscreenTileContext,
} from 'components/DashboardBuilderApp/hooks/useFullscreenTileContext';
import useSavedDashboard from 'components/DashboardBuilderApp/hooks/useSavedDashboard';
import useScreenSizeDependentState from 'components/DashboardBuilderApp/hooks/useScreenSizeDependentState';
import useStoreUnsavedChangesOnTimeout from 'components/DashboardBuilderApp/hooks/useStoreUnsavedChangesOnTimeout';
import { IS_LEGACY_EXPERIENCE } from 'components/DashboardBuilderApp/constants';
import type { ZoomSetting } from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton/DashboardZoomLevelButton';

type Props = {};

// TODO: Consider extracting these to a service call.
const BACKEND_DASHBOARD_OPTIONS = window.__JSON_FROM_BACKEND.dashboard;
const DASHBOARD_URI: string = BACKEND_DASHBOARD_OPTIONS.dashboardUri;
const DASHBOARD_SLUG: string = BACKEND_DASHBOARD_OPTIONS.activeDashboard;

// NOTE: If the user is in the legacy experience, they *must* be in
// present mode regardless of permissions or deployment.
const ALLOW_EDIT_WITHOUT_SAVE_PERMISSION: boolean = !IS_LEGACY_EXPERIENCE;

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
  const [
    lastSavedDashboard,
    onSaveDashboard,
    initialDashboardLoadStatus,
  ] = useSavedDashboard(DASHBOARD_URI);

  // Load in any unsaved changes to be applied on top of the saved dashboard
  const [
    currentDashboard,
    onDashboardChange,
    initialAugmentedDashboardLoadStatus,
  ] = useAugmentedDashboard(DASHBOARD_URI, lastSavedDashboard);

  const fullscreenTileContext = useFullscreenTileContext(
    currentDashboard === undefined
      ? []
      : currentDashboard.specification().items(),
  );

  // If a session times out with unsaved changes we store those changes in local
  // storage and load them back in in useAugmentedDashboard.
  useStoreUnsavedChangesOnTimeout(currentDashboard, lastSavedDashboard);

  const [isAdministrator, isEditor] = useDashboardAuthorization(DASHBOARD_SLUG);

  // NOTE: This is a temporary segment event used to trigger the appcues
  // onboarding experience for the modern dashboard app.
  React.useEffect(() => {}, [isEditor]);

  const [presenting, setPresenting] = React.useState(
    !isEditor && !isAdministrator && !ALLOW_EDIT_WITHOUT_SAVE_PERMISSION,
  );

  React.useEffect(() => {
    setPresenting(
      !isEditor && !isAdministrator && !ALLOW_EDIT_WITHOUT_SAVE_PERMISSION,
    );
  }, [isAdministrator, isEditor]);

  // NOTE: If the screen is too small, we should not render the
  // dashboard container at all. We should just render the loading bar and wait
  // for the user to resize the screen so that it is large enough to show the
  // dashboard.
  if (
    initialDashboardLoadStatus === 'loading' ||
    initialAugmentedDashboardLoadStatus === 'loading' ||
    screenTooSmall
  ) {
    return (
      <Spacing paddingTop="xxxl">
        <ProgressBar />
      </Spacing>
    );
  }

  if (initialDashboardLoadStatus === 'error') {
    // TODO: Implement a full error page. For now we just show a blank
    // page. There is also a toast shown in the useSavedDashboard hook.
    return <div />;
  }

  if (!currentDashboard || !lastSavedDashboard) {
    return (
      <Spacing paddingTop="xxxl">
        <ProgressBar />
      </Spacing>
    );
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
          isAdministrator={isAdministrator}
          isEditor={isEditor}
          lastSavedDashboard={lastSavedDashboard}
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
