// @flow
import * as React from 'react';
import classNames from 'classnames';

import BasicElementsSection from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/BasicElementsSection';
import CommonFilterSettings from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/CommonFilterSettings';
import CommonGroupingSettings from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/CommonGroupingSettings';
import Group from 'components/ui/Group';
import IconButton from 'components/ui/IconButton';
import LayoutSection from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/LayoutSection';
import useDashboardQueryItemTitles from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/hooks/useDashboardQueryItemTitles';
import useOpenClosePanel from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/hooks/useOpenClosePanel';
import type DashboardCommonSettings from 'models/DashboardBuilderApp/DashboardCommonSettings';
import type DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';

type Props = {
  collapse: boolean,
  horizontal: boolean,
  items: $ReadOnlyArray<DashboardItemHolder>,
  onSettingsChange: DashboardCommonSettings => void,
  presenting: boolean,
  settings: DashboardCommonSettings,
};

/**
 * The CommonSettingsPanel stores all settings that can apply to many dashboard
 * items on the page. Right now it primarily stores the dashboard level filters
 * and groupings that apply to query tiles.
 */
function CommonSettingsPanel({
  collapse,
  horizontal,
  items,
  onSettingsChange,
  presenting,
  settings,
}: Props) {
  const dashboardQueryItemTitles = useDashboardQueryItemTitles(items);

  const [closePanel, toggleClosePanel] = useOpenClosePanel();

  const onFilterSettingsChange = React.useCallback(
    newFilterSettings =>
      onSettingsChange(settings.filterSettings(newFilterSettings)),
    [onSettingsChange, settings],
  );
  const onGroupingSettingsChange = React.useCallback(
    newGroupingSettings =>
      onSettingsChange(settings.groupingSettings(newGroupingSettings)),
    [onSettingsChange, settings],
  );

  const filterSettings = settings.filterSettings();
  const filterSettingsPanel = filterSettings.visible && (
    <CommonFilterSettings
      collapse={collapse}
      dashboardQueryItemTitles={dashboardQueryItemTitles}
      horizontal={horizontal}
      onSettingsChange={onFilterSettingsChange}
      presenting={presenting}
      settings={filterSettings}
    />
  );

  const groupingSettings = settings.groupingSettings();
  const groupingSettingsPanel = groupingSettings.visible && (
    <CommonGroupingSettings
      collapse={collapse}
      dashboardQueryItemTitles={dashboardQueryItemTitles}
      horizontal={horizontal}
      onSettingsChange={onGroupingSettingsChange}
      presenting={presenting}
      settings={groupingSettings}
    />
  );

  const openCloseButton = (
    <IconButton
      className="gd-dashboard-common-settings-panel__open-close-button"
      onClick={toggleClosePanel}
      type={closePanel ? 'chevron-right' : 'chevron-left'}
    />
  );

  if (horizontal) {
    return (
      <div>
        {filterSettingsPanel}
        {groupingSettingsPanel}
      </div>
    );
  }

  const leftPanelClassName = classNames(
    'gd-dashboard-common-settings-panel--left-aligned',
    {
      'gd-dashboard-common-settings-panel--closed': closePanel,
    },
  );

  return (
    <Group.Vertical className={leftPanelClassName} flex>
      <div className="gd-dashboard-common-settings-panel__main-content">
        {groupingSettingsPanel}
        {filterSettingsPanel}
      </div>
      {openCloseButton}
    </Group.Vertical>
  );
}

export default (React.memo(
  CommonSettingsPanel,
): React.AbstractComponent<Props>);
