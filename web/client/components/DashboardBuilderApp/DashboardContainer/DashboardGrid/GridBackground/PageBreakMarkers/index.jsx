// @flow
import * as React from 'react';

import PageBreakMarker from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/GridBackground/PageBreakMarkers/PageBreakMarker';
import {
  A4_PAGE_HEIGHT,
  A4_PAGE_WIDTH,
} from 'components/DashboardBuilderApp/DashboardScreenshotApp/screenshotUtil';

type Props = {
  gridHeight: number,
  pageWidth: number,
  repositioningTiles: boolean,
  zoomLevel: number,
};

/**
 * A collection of markers postioned to indicate page breaks on a dashboard
 * grid.
 */
export default function PageBreakMarkers({
  gridHeight,
  pageWidth,
  repositioningTiles,
  zoomLevel,
}: Props): React.Node {
  const pageHeight = A4_PAGE_HEIGHT * (pageWidth / A4_PAGE_WIDTH) * zoomLevel;

  const numPages = Math.ceil((gridHeight * zoomLevel) / pageHeight);

  const pageBreakMarkers = [];
  for (let pageNumber = 2; pageNumber <= numPages; pageNumber++) {
    pageBreakMarkers.push(
      <PageBreakMarker
        key={pageNumber}
        pageNumber={pageNumber}
        pageHeight={pageHeight}
        repositioningTiles={repositioningTiles}
      />,
    );
  }

  return pageBreakMarkers;
}
