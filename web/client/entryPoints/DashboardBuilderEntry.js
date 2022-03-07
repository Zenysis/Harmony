// @flow
import Navbar from 'components/Navbar';
import { IS_SCREENSHOT_REQUEST } from 'components/DashboardBuilderApp/DashboardScreenshotApp/screenshotUtil';
import { monitorSessionTimeout } from 'util/timeoutSession';
import { renderToDOM as renderScreenshotAppToDOM } from 'components/DashboardBuilderApp/DashboardScreenshotApp';
import { renderToDOM } from 'components/DashboardBuilderApp';

if (IS_SCREENSHOT_REQUEST) {
  renderScreenshotAppToDOM();
} else {
  Navbar.renderToDOM();
  renderToDOM();
}

monitorSessionTimeout();
