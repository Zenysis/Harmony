// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';
import invariant from 'invariant';

import ProgressBar from 'components/ui/ProgressBar';
import ScreenshotView from 'components/DashboardBuilderApp/DashboardScreenshotApp/ScreenshotView';
import Spacing from 'components/ui/Spacing';
import useAugmentedDashboard from 'components/DashboardBuilderApp/hooks/useAugmentedDashboard';
import useSavedDashboard from 'components/DashboardBuilderApp/hooks/useSavedDashboard';

type Props = {};

// TODO(david, nina, moriah): Consider extracting to a service call.
const DASHBOARD_URI: string = window.__JSON_FROM_BACKEND.dashboard.dashboardUri;

export function renderToDOM(elementId?: string = 'app'): void {
  const elt: ?HTMLElement = document.getElementById(elementId);
  invariant(elt, `Element ID does not exist: ${elementId}`);
  ReactDOM.render(<DashboardScreenshotApp />, elt);
}

/**
 * The DashboardScreenshotApp component represents the page a user should see
 * when entering screenshot mode. It is a thin wrapper around the
 * the DashboardGrid component, allowing us to only render necessary items to
 * this mode.
 */
function DashboardScreenshotApp(): React.Node {
  // eslint-disable-next-line no-unused-vars
  const [lastSavedDashboard, onSaveDashboard, status] = useSavedDashboard(
    DASHBOARD_URI,
  );

  // NOTE(nina, david): This loads in dashboard sessions with unsaved changes,
  // including those stored on timeout (which we don't need). Screenshots are made
  // by the automation account, which never has unsaved changes stored on
  // timeout, so shouldn't have to guard against those changes.
  const [dashboard] = useAugmentedDashboard(DASHBOARD_URI, lastSavedDashboard);

  if (status === 'loading') {
    return (
      <Spacing paddingTop="xxxl">
        <ProgressBar />
      </Spacing>
    );
  }

  if (status === 'error') {
    // TODO(david, nina): Implement a full error page.
    return <div />;
  }

  invariant(dashboard, `dashboard should always exist when status is success`);

  return (
    <div className="gd-dashboard-screenshot-app">
      <ScreenshotView dashboard={dashboard} />
    </div>
  );
}

export default (React.memo(
  DashboardScreenshotApp,
): React.AbstractComponent<Props>);
