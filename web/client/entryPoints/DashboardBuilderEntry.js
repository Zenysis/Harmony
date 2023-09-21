/* eslint-disable zen/zen-import-order */
// @flow
import {
  executeRenderEntry,
  executeRenderEntryWithoutNavbar,
} from 'entryPoints/baseEntry';
import { IS_IFRAME_REQUEST } from 'components/DashboardBuilderApp/EmbeddedDashboardApp/embeddingUtil';
import { IS_SCREENSHOT_REQUEST } from 'components/DashboardBuilderApp/DashboardScreenshotApp/screenshotUtil';
import { renderToDOM as renderEmbeddedDashboardAppToDOM } from 'components/DashboardBuilderApp/EmbeddedDashboardApp';
import { renderToDOM as renderScreenshotAppToDOM } from 'components/DashboardBuilderApp/DashboardScreenshotApp';
import { renderToDOM } from 'components/DashboardBuilderApp';

if (IS_SCREENSHOT_REQUEST) {
  executeRenderEntryWithoutNavbar(renderScreenshotAppToDOM);
} else if (IS_IFRAME_REQUEST) {
  executeRenderEntryWithoutNavbar(renderEmbeddedDashboardAppToDOM);
} else {
  executeRenderEntry(renderToDOM);
}
