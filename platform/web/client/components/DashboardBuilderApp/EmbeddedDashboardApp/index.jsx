// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';
import invariant from 'invariant';

import DashboardContainer from 'components/DashboardBuilderApp/DashboardContainer';
import ProgressBar from 'components/ui/ProgressBar';
import Spacing from 'components/ui/Spacing';
import useAugmentedDashboard from 'components/DashboardBuilderApp/hooks/useAugmentedDashboard';
import useFullscreenTileContext, {
  FullscreenTileContext,
} from 'components/DashboardBuilderApp/hooks/useFullscreenTileContext';
import useSavedDashboard from 'components/DashboardBuilderApp/hooks/useSavedDashboard';
import useScreenSizeDependentState from 'components/DashboardBuilderApp/hooks/useScreenSizeDependentState';

type Props = {};

const BACKEND_DASHBOARD_OPTIONS = window.__JSON_FROM_BACKEND.dashboard;
const DASHBOARD_URI: string = BACKEND_DASHBOARD_OPTIONS.dashboardUri;

export function renderToDOM(elementId?: string = 'app'): void {
  const elt: ?HTMLElement = document.getElementById(elementId);
  invariant(elt, `Element ID does not exist: ${elementId}`);
  ReactDOM.render(<EmbeddedDashboardApp />, elt);
}

/**
 * The EmbeddedDashboardApp app is use to render dashboards in embedded mode
 */
function EmbeddedDashboardApp(): React.Node {
  const [collapse, screenTooSmall] = useScreenSizeDependentState();

  const [
    lastSavedDashboard,
    // eslint-disable-next-line no-unused-vars
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

  const [iframeId, setIframeId] = React.useState();

  function receiveMessage(event) {
    // NOTE wouold be good for security to limit sites that can post messages to dashboard
    /* if (event.origin !== 'http://localhost:9000')
      return; */

    // Read message from iFrameSizer that contains the iframeId set on the page embedding the dashboard.
    // e.g. [iFrameSizer]dashboardIframe:8:false:true:32:true:true:null:offset:null:null:0
    // where dashboardIframe is the ID.
    if (typeof event.data === 'string') {
      const result = event.data.match(/\]([^:]+):/);
      if (result && result[1]) setIframeId(result[1]);
    }
  }

  window.addEventListener('message', receiveMessage, false);

  React.useEffect(() => {
    // NOTE: Post an initial hieght that will allow the tiles to render
    // 500 seems to be the height that doesnt make the iframe flicker when resizing it
    if (iframeId)
      window.parent.postMessage(`[iFrameSizer]${iframeId}:500:100:init`, '*');
  }, [iframeId]);

  const getContainerHeight = (height: number) => {
    if (iframeId)
      window.parent.postMessage(
        `[iFrameSizer]${iframeId}:${height - 31}:100:init`,
        '*',
      );
  };

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

  // TODO: Discuss to determine how we enabled <DashboardHeader/> in embedded mode
  // for deployments that might require it.
  return (
    <FullscreenTileContext.Provider value={fullscreenTileContext}>
      <DashboardContainer
        collapse={collapse}
        dashboard={currentDashboard}
        getContainerHeight={getContainerHeight}
        hasUnsavedChanges={currentDashboard !== lastSavedDashboard}
        onDashboardChange={onDashboardChange}
        presenting
        zoomSetting="fit"
      />
    </FullscreenTileContext.Provider>
  );
}

export default (React.memo(
  EmbeddedDashboardApp,
): React.AbstractComponent<Props>);
