// @flow
// NOTE(stephen): This file contains very specific detection logic to help aid
// the urlbox rendering and capture process. It relies on specific DOM structure
// to find visualizations and test their status. It is *brittle* and the
// detection logic might break down if the DOM changes. This is a best effort
// *right now* but could definitely be improved.
import * as React from 'react';
import Promise from 'bluebird';

import waitForMapboxMapLoad from 'components/common/SharingUtil/waitForMapboxMapLoad';
import type DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';

// NOTE(stephen): `document.body` will never be missing, but Flow thinks that it
// can be. Cast it to be non-null so we don't need to check everytime we touch
// it.
const DOCUMENT_BODY = ((document.body: $Cast): HTMLBodyElement);

/**
 * Wait for all visualizations to finish adjusting their layout inside the DOM.
 * This is most useful for SVG visualizations that use the ResponsiveContainer
 * component to tweak their width/height based on the available space.
 */
function waitForVisualizationsToSettle(): Promise<void> {
  // NOTE(stephen): Right now, there is no extra logic, we just wait a second.
  // If there are specific cases for visualizations (other than maps) that we
  // want to handle, it can happen here.
  return new Promise(resolve => {
    setTimeout(resolve, 1000);
  });
}

/**
 * Test if all visualizations that are expected to be rendered have been
 * rendered, and that there are no progress bars being shown.
 */
function haveVisualizationsLoaded(expectedCount: number): boolean {
  const containersWithProgress = document.querySelectorAll(
    '.visualization-container .progress',
  );
  if (containersWithProgress.length > 0) {
    return false;
  }

  const containersWithNoData = document.querySelectorAll(
    '.visualization-container > .no-results-screen',
  );
  const containersWithData = document.querySelectorAll(
    '.visualization-container .visualization',
  );
  const loadedCount = containersWithNoData.length + containersWithData.length;
  return loadedCount === expectedCount;
}

/**
 * Wait for all the visualizations to finish fetching data. Continuously poll
 * the document to check the state of the elements. If we never finish loading,
 * it is likely that the urlbox timeout will be hit on their server and the page
 * will still be captured.
 */
function waitForVisualizationDataToLoad(
  items: $ReadOnlyArray<DashboardItemHolder>,
): Promise<void> {
  const queryTileCount = items.filter(
    itemHolder => itemHolder.item().tag === 'QUERY_ITEM',
  ).length;
  if (queryTileCount === 0) {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    const intervalId = setInterval(() => {
      if (haveVisualizationsLoaded(queryTileCount)) {
        clearInterval(intervalId);
        resolve();
      }
    }, 50);
  });
}

/**
 * Wait for all maps on the page, GIS and MapViz, to finish rendering. This uses
 * the same logic that the in-browser Download as Image feature uses to make
 * sure the mapbox-gl canvas is finished drawing.
 */
function waitForMapsToLoad(): Promise<void> {
  // Find the MapboxGL elements that react-map-gl will render.
  const mapboxElements = Array.from(
    DOCUMENT_BODY.querySelectorAll('.mapboxgl-map'),
  );
  if (mapboxElements.length === 0) {
    return Promise.resolve();
  }

  return Promise.all(mapboxElements.map(waitForMapboxMapLoad)).then(() => {});
}

/**
 * This hook sends a signal inside the HTML DOM that indicates the state of the
 * dashboard load. When the dashboard is loading, there will be an element with
 * ID `dashboard-load-in-progress`. When the dashboard has finished loading,
 * there will be an element with ID `dashboard-load-success`.
 */
export default function useSignalDashboardLoadState(
  items: $ReadOnlyArray<DashboardItemHolder>,
) {
  // NOTE(stephen): We only want this hook to run exactly once when the
  // dashboard has been received from the server.
  React.useEffect(() => {
    const elt = document.createElement('div');
    elt.id = 'dashboard-load-in-progress';
    DOCUMENT_BODY.appendChild(elt);

    waitForVisualizationDataToLoad(items)
      .then(waitForVisualizationsToSettle)
      .then(waitForMapsToLoad)
      .then(() => {
        elt.id = 'dashboard-load-success';
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
