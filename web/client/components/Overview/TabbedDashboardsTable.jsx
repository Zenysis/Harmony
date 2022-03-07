// @flow

import * as React from 'react';

import * as Zen from 'lib/Zen';
import DashboardTable from 'components/Overview/DashboardTable';
import InputText from 'components/ui/InputText';
import Tab from 'components/ui/Tabs/Tab';
import Tabs from 'components/ui/Tabs';
import { partition } from 'util/arrayUtil';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';

type Props = {
  dashboards: Zen.Array<DashboardMeta>,
  dashboardsLoaded: boolean,
  onUpdateDashboardIsFavorite?: (
    dashboard: DashboardMeta,
    isFavorite: boolean,
  ) => void,
  showUserDashboards: boolean,
};

type DashboardTabConfig = {
  dashboards: $ReadOnlyArray<DashboardMeta>,
  testId: string,
  title: string,
};

const TEXT = t('OverviewApp.dashboards');

function TabbedDashboardsTable({
  dashboards,
  dashboardsLoaded,
  onUpdateDashboardIsFavorite = undefined,
  showUserDashboards,
}: Props) {
  const [searchText, setSearchText] = React.useState<string>('');

  const { username } = window.__JSON_FROM_BACKEND.user;

  const [selectedTab, setSelectedTab] = React.useState<string>(
    TEXT.userTabTitle,
  );

  const [userDashboards, otherDashboards] = React.useMemo(
    () =>
      partition(
        dashboards.arrayView(),
        dashboard => dashboard.author() === username,
      ),
    [dashboards, username],
  );

  React.useEffect(() => {
    // Default to "Other Dashboards" if user has no dashboards.
    if (dashboardsLoaded && userDashboards.length === 0) {
      setSelectedTab(TEXT.otherTabTitle);
    }
    // NOTE(david): We deliberately only run this hook when the dashboards are
    // first loaded as we are only setting the initial default tab
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardsLoaded]);

  const dashboardTabs = React.useMemo<
    $ReadOnlyArray<DashboardTabConfig>,
  >(() => {
    const userDashboardsTab = {
      dashboards: userDashboards,
      testId: 'overview-user-dashboards-tab',
      title: TEXT.userTabTitle,
    };
    const otherDashboardsTab = {
      dashboards: otherDashboards,
      testId: 'overview-other-dashboards-tab',
      title: TEXT.otherTabTitle,
    };
    if (!showUserDashboards) {
      return [otherDashboardsTab];
    }
    return [userDashboardsTab, otherDashboardsTab];
  }, [otherDashboards, showUserDashboards, userDashboards]);

  const dashboardTables = dashboardTabs.map(tabConfig => (
    <Tab
      key={tabConfig.title}
      className="dashboards-overview__section-contents"
      name={tabConfig.title}
      testId={tabConfig.testId}
    >
      <DashboardTable
        dashboards={tabConfig.dashboards}
        dashboardsLoaded={dashboardsLoaded}
        dashboardTabName={tabConfig.title}
        onUpdateDashboardIsFavorite={onUpdateDashboardIsFavorite}
        searchText={searchText}
      />
    </Tab>
  ));

  const searchBar = (
    <InputText
      className="dashboards-overview__dashboard-search"
      icon="search"
      onChange={setSearchText}
      placeholder={TEXT.search}
      value={searchText}
    />
  );

  return (
    <Tabs.Controlled
      className="dashboards-overview__dashboard-section-contents"
      headerRowClassName="dashboards-overview__tabs-header-row"
      headerRowRightContent={searchBar}
      onTabChange={setSelectedTab}
      selectedTab={selectedTab}
    >
      {dashboardTables}
    </Tabs.Controlled>
  );
}

export default (React.memo(
  TabbedDashboardsTable,
): React.AbstractComponent<Props>);
