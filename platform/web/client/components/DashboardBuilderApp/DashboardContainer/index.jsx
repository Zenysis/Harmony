// @flow
import * as React from 'react';
import classNames from 'classnames';

import CommonSettingsPanel from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel';
import DashboardGrid from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid';
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
import { ENABLE_M2_DASHBOARD_SIDEBAR } from 'components/DashboardBuilderApp/flags';
import { IS_IFRAME_REQUEST } from 'components/DashboardBuilderApp/EmbeddedDashboardApp/embeddingUtil';
import { IS_SCREENSHOT_REQUEST } from 'components/DashboardBuilderApp/DashboardScreenshotApp/screenshotUtil';
import type Dashboard from 'models/core/Dashboard';
import type { ZoomSetting } from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton/DashboardZoomLevelButton';

type Props = {
  collapse: boolean,
  dashboard: Dashboard,
  getContainerHeight?: number => void,
  hasUnsavedChanges: boolean,
  onDashboardChange: Dashboard => void,
  presenting: boolean,
  zoomSetting: ZoomSetting,
};

/**
 * The DashboardContainer renders the primary dashboard content, including all
 * the dashboard tiles and the common dashboard settings.
 *
 * NOTE: The DashboardContainer is the *last place in the
 * tree* that the legacy dashboard models are used. Everything rendered
 * below the DashboardContainer uses the modern DashboardBuilderApp model
 * structure and has no idea what the legacy models do.
 */
function DashboardContainer({
  collapse,
  dashboard,
  getContainerHeight,
  hasUnsavedChanges,
  onDashboardChange,
  presenting,
  zoomSetting,
}: Props) {
  const legacy = dashboard.specification().legacy();

  // Check whether to activate tile download menus
  // and the tile hover effect
  const { user } = window.__JSON_FROM_BACKEND;
  const { isAuthenticated } = user;
  const activateTileDownloads =
    !IS_SCREENSHOT_REQUEST &&
    presenting &&
    ((isAuthenticated && dashboard.registeredUsersCanDownloadData()) ||
      (!isAuthenticated && dashboard.unregisteredUsersCanDownloadData()));

  // NOTE: Temporarily allow layout overrides while we tweak the new
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

  // NOTE: We declare the container padding here rather than directly on
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

  const currentRef = gridContainerRef.current;

  React.useEffect(() => {
    if (currentRef) {
      // Add 30px here for padding as the exact height the grid background renders at is window
      // dependent. This will appear to just be bottom padding for the dashboard container.
      const height =
        currentRef.getBoundingClientRect().top + currentRef.scrollHeight + 30;

      // NOTE: this is a hack to get the height of the dashboard container fixed on mobile devices.
      if (getContainerHeight)
        getContainerHeight(window.innerWidth < 768 ? 1000 : height);
    }
  }, [currentRef, getContainerHeight]);

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
        updateDashboardOnItemClone(
          itemHolder,
          dashboard,
          columnCount,
          cellsPerColumn,
        ),
      ),
    [cellsPerColumn, columnCount, dashboard, onDashboardChange],
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
    ENABLE_M2_DASHBOARD_SIDEBAR ||
    commonSettings.filterSettings().visible ||
    commonSettings.groupingSettings().visible;

  // NOTE: We force the common settings panel to be horizontal in
  // collapsed layout as the vertical side panel does not have a view suitable
  // for small screens
  const useHorizontalSettingsPanel =
    commonSettings.panelAlignment() === 'TOP' || collapse;

  const className = classNames('gd-dashboard-container', {
    'gd-dashboard-container--embedded': IS_IFRAME_REQUEST,
    'gd-dashboard-container--settings-left':
      showCommonSettingsPanel &&
      !useHorizontalSettingsPanel &&
      !IS_IFRAME_REQUEST,
    'gd-dashboard-container--settings-top':
      showCommonSettingsPanel && useHorizontalSettingsPanel,
  });

  const containerClassName = classNames(
    'gd-dashboard-container__grid-container',
    {
      'gd-dashboard-container__grid-container-embedded': IS_IFRAME_REQUEST,
    },
  );

  const renderCommonSettingsPanel = () => {
    // NOTE: Don't show the common settings panel in embedded mode
    // unless the panel alignment is set to top
    if (
      showCommonSettingsPanel &&
      IS_IFRAME_REQUEST &&
      !useHorizontalSettingsPanel
    ) {
      return null;
    }

    if (showCommonSettingsPanel) {
      return (
        <CommonSettingsPanel
          collapse={collapse}
          horizontal={useHorizontalSettingsPanel}
          items={items}
          onSettingsChange={onCommonSettingsChange}
          presenting={presenting}
          settings={commonSettings}
        />
      );
    }
    return null;
  };

  return (
    <div className={className}>
      {renderCommonSettingsPanel()}
      <div ref={gridContainerRef} className={containerClassName}>
        <Spacing
          className="gd-dashboard-container__dashboard-grid"
          paddingBottom={collapse || presenting ? 'm' : undefined}
          style={{
            paddingLeft: gridContainerHorizontalPadding,
            paddingRight: gridContainerHorizontalPadding,
            paddingTop: '30px',
          }}
        >
          <DashboardGrid
            activateTileDownloads={activateTileDownloads}
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
    </div>
  );
}

export default (React.memo(DashboardContainer): React.AbstractComponent<Props>);
