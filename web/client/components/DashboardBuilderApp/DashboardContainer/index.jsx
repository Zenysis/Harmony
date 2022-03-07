// @flow
import * as React from 'react';
import classNames from 'classnames';

import CommonSettingsPanel from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel';
import DashboardGrid from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid';
import GridLayoutDebugTools from 'components/DashboardBuilderApp/DashboardContainer/GridLayoutDebugTools';
import ScrollToTopButton from 'components/DashboardBuilderApp/DashboardContainer/ScrollToTopButton';
import Spacing from 'components/ui/Spacing';
import calculateZoomLevel from 'components/DashboardBuilderApp/DashboardContainer/calculateZoomLevel';
import updateDashboardOnItemChange from 'components/DashboardBuilderApp/DashboardContainer/updateDashboard/updateDashboardOnItemChange';
import updateDashboardOnItemClone from 'components/DashboardBuilderApp/DashboardContainer/updateDashboard/updateDashboardOnItemClone';
import updateDashboardOnItemDelete from 'components/DashboardBuilderApp/DashboardContainer/updateDashboard/updateDashboardOnItemDelete';
import updateDashboardOnItemsChange from 'components/DashboardBuilderApp/DashboardContainer/updateDashboard/updateDashboardOnItemsChange';
import useElementSize from 'lib/hooks/useElementSize';
import useGridLayout from 'components/DashboardBuilderApp/DashboardContainer/hooks/useGridLayout';
import useMergedRef from 'lib/hooks/useMergedRef';
import useScrollToNewTile from 'components/DashboardBuilderApp/DashboardContainer/hooks/useScrollToNewTile';
import type Dashboard from 'models/core/Dashboard';
import type { ZoomSetting } from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton/DashboardZoomLevelButton';

type Props = {
  collapse: boolean,
  dashboard: Dashboard,
  hasUnsavedChanges: boolean,
  onDashboardChange: Dashboard => void,
  presenting: boolean,
  zoomSetting: ZoomSetting,
};

/**
 * The DashboardContainer renders the primary dashboard content, including all
 * the dashboard tiles and the common dashboard settings.
 *
 * NOTE(stephen, nina): The DashboardContainer is the *last place in the
 * tree* that the legacy dashboard models are used. Everything rendered
 * below the DashboardContainer uses the modern DashboardBuilderApp model
 * structure and has no idea what the legacy models do.
 */
function DashboardContainer({
  collapse,
  dashboard,
  hasUnsavedChanges,
  onDashboardChange,
  presenting,
  zoomSetting,
}: Props) {
  const legacy = dashboard.specification().legacy();

  // NOTE(stephen): Temporarily allow layout overrides while we tweak the new
  // dashboard layout.
  const [layoutOverrides, setLayoutOverrides] = React.useState({});
  const [
    columnCount,
    cellsPerColumn,
    cellSize,
    horizontalPadding,
    verticalPadding,
    tilePadding,
  ] = useGridLayout(collapse, legacy, layoutOverrides);

  // NOTE(david): We declare the container padding here rather than directly on
  // the Spacing component so that we can use the value in our zoom level
  // calculations.
  const gridContainerHorizontalPadding = collapse ? 0 : 32;

  const gridContainerScrollingRef = React.useRef();
  const [
    { width: gridContainerWidth },
    gridContainerSizeRef,
  ] = useElementSize();
  const gridContainerRef = useMergedRef([
    gridContainerScrollingRef,
    gridContainerSizeRef,
  ]);

  const zoomLevel = calculateZoomLevel(
    cellsPerColumn,
    cellSize,
    columnCount,
    gridContainerHorizontalPadding,
    gridContainerWidth,
    horizontalPadding,
    legacy,
    collapse,
    zoomSetting,
  );

  const commonSettings = dashboard.specification().commonSettings();

  const onChangeTile = React.useCallback(
    itemHolder =>
      onDashboardChange(updateDashboardOnItemChange(itemHolder, dashboard)),
    [dashboard, onDashboardChange],
  );

  const onCloneTile = React.useCallback(
    itemHolder =>
      onDashboardChange(
        updateDashboardOnItemClone(itemHolder, dashboard, columnCount),
      ),
    [columnCount, dashboard, onDashboardChange],
  );

  const onDeleteTile = React.useCallback(
    itemHolder =>
      onDashboardChange(updateDashboardOnItemDelete(itemHolder, dashboard)),
    [dashboard, onDashboardChange],
  );

  const onItemsChange = React.useCallback(
    newItems =>
      onDashboardChange(updateDashboardOnItemsChange(newItems, dashboard)),
    [dashboard, onDashboardChange],
  );

  const items = dashboard.specification().items();

  useScrollToNewTile(dashboard.specification().items(), hasUnsavedChanges);

  const onCommonSettingsChange = React.useCallback(
    newCommonSettings =>
      onDashboardChange(
        dashboard
          .deepUpdate()
          .specification()
          .commonSettings(newCommonSettings),
      ),
    [dashboard, onDashboardChange],
  );

  const showCommonSettingsPanel =
    commonSettings.filterSettings().visible ||
    commonSettings.groupingSettings().visible;

  // NOTE(david): We force the common settings panel to be horizontal in
  // collapsed layout as the vertical side panel does not have a view suitable
  // for small screens
  const useHorizontalSettingsPanel =
    commonSettings.panelAlignment() === 'TOP' || collapse;

  const className = classNames('gd-dashboard-container', {
    'gd-dashboard-container--settings-top':
      showCommonSettingsPanel && useHorizontalSettingsPanel,
    'gd-dashboard-container--settings-left':
      showCommonSettingsPanel && !useHorizontalSettingsPanel,
  });

  return (
    <div className={className}>
      {showCommonSettingsPanel && (
        <CommonSettingsPanel
          collapse={collapse}
          horizontal={useHorizontalSettingsPanel}
          items={items}
          onSettingsChange={onCommonSettingsChange}
          presenting={presenting}
          settings={commonSettings}
        />
      )}
      <div
        ref={gridContainerRef}
        className="gd-dashboard-container__grid-container"
      >
        <Spacing
          className="gd-dashboard-container__dashboard-grid"
          paddingBottom={collapse || presenting ? 'm' : undefined}
          style={{
            paddingTop: '30px',
            paddingLeft: gridContainerHorizontalPadding,
            paddingRight: gridContainerHorizontalPadding,
          }}
        >
          <DashboardGrid
            cellSize={cellSize}
            cellsPerColumn={cellsPerColumn}
            collapse={collapse}
            columnCount={columnCount}
            commonSettings={commonSettings}
            horizontalPadding={horizontalPadding}
            items={items}
            lazyload
            legacy={legacy}
            onChangeTile={onChangeTile}
            onCloneTile={onCloneTile}
            onDeleteTile={onDeleteTile}
            onItemsChange={onItemsChange}
            presenting={presenting}
            tilePadding={tilePadding}
            verticalPadding={verticalPadding}
            zoomLevel={zoomLevel}
          />
        </Spacing>
      </div>
      <ScrollToTopButton containerElt={gridContainerRef.current} />
      <GridLayoutDebugTools
        cellSize={cellSize}
        cellsPerColumn={cellsPerColumn}
        columnCount={columnCount}
        horizontalPadding={horizontalPadding}
        onApplyLayoutOverrides={setLayoutOverrides}
        tilePadding={tilePadding}
        verticalPadding={verticalPadding}
      />
    </div>
  );
}

export default (React.memo(DashboardContainer): React.AbstractComponent<Props>);
