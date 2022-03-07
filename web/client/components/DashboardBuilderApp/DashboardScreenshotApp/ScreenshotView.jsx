// @flow
import * as React from 'react';

import DashboardGrid from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid';
import useGridLayout from 'components/DashboardBuilderApp/DashboardContainer/hooks/useGridLayout';
import useSignalDashboardLoadState from 'components/DashboardBuilderApp/DashboardScreenshotApp/hooks/useSignalDashboardLoadState';
import {
  A4_PAGE_WIDTH,
  IS_PDF_REQUEST,
  JPEG_SCREENSHOT_WIDTH,
} from 'components/DashboardBuilderApp/DashboardScreenshotApp/screenshotUtil';
import { noop } from 'util/util';
import type Dashboard from 'models/core/Dashboard';

type Props = { dashboard: Dashboard };

function ScreenshotView({ dashboard }: Props): React.Node {
  const legacy = dashboard.specification().legacy();

  const commonSettings = dashboard.specification().commonSettings();
  const [
    columnCount,
    cellsPerColumn,
    cellSize,
    horizontalPadding,
    verticalPadding,
    tilePadding,
  ] = useGridLayout(false, legacy);

  const items = dashboard.specification().items();
  useSignalDashboardLoadState(items);

  const desiredWidth = IS_PDF_REQUEST ? A4_PAGE_WIDTH : JPEG_SCREENSHOT_WIDTH;

  // Set the zoom level so that the full dashboard grid fits inside the desired
  // page size without getting cut off.
  const fullWidth =
    cellSize * cellsPerColumn * columnCount + horizontalPadding * 2;
  const zoomLevel = desiredWidth / fullWidth;
  return (
    <DashboardGrid
      cellSize={cellSize}
      cellsPerColumn={cellsPerColumn}
      collapse={false}
      columnCount={columnCount}
      commonSettings={commonSettings}
      disableGridBackground
      horizontalPadding={horizontalPadding}
      items={items}
      legacy={legacy}
      onChangeTile={noop}
      onCloneTile={noop}
      onDeleteTile={noop}
      onItemsChange={noop}
      presenting
      tilePadding={tilePadding}
      verticalPadding={verticalPadding}
      zoomLevel={zoomLevel}
    />
  );
}

export default (React.memo(ScreenshotView): React.AbstractComponent<Props>);
