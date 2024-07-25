// @flow

import * as React from 'react';

import * as Zen from 'lib/Zen';
import DashboardTable from 'components/Overview/DashboardTable';
import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';
import Tab from 'components/ui/Tabs/Tab';
import Tabs from 'components/ui/Tabs';
import { RESOURCE_ROLE_MAP } from 'services/AuthorizationService/registry';
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

function TabbedDashboardsTable({
  dashboards,
  dashboardsLoaded,
  onUpdateDashboardIsFavorite = undefined,
  showUserDashboards,
}: Props) {
  const [searchText, setSearchText] = React.useState<string>('');

  const { username } = window.__JSON_FROM_BACKEND.user;

  const [selectedTab, setSelectedTab] = React.useState<string>(
    I18N.textById('My Dashboards'),
  );

  const [userDashboards, otherDashboards] = React.useMemo(
    () =>
      partition(
        dashboards.arrayView(),
        dashboard =>
          (dashboard.author() === username && !!dashboard.myRoles().length) ||
          dashboard.myRoles().indexOf(RESOURCE_ROLE_MAP.DASHBOARD_ADMIN) >= 0,
      ),
    [dashboards, username],
  );

  React.useEffect(() => {
    // Default to "Other Dashboards" if user has no dashboards.
    if (dashboardsLoaded && userDashboards.length === 0) {
      setSelectedTab(I18N.textById('Other Dashboards'));
    }
    // NOTE: We deliberately only run this hook when the dashboards are
    // first loaded as we are only setting the initial default tab
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardsLoaded]);

  const dashboardTabs = React.useMemo<
    $ReadOnlyArray<DashboardTabConfig>,
  >(() => {
    const userDashboardsTab = {
      dashboards: userDashboards,
      testId: 'overview-user-dashboards-tab',
      title: I18N.textById('My Dashboards'),
    };
    const otherDashboardsTab = {
      dashboards: otherDashboards,
      testId: 'overview-other-dashboards-tab',
      title: I18N.textById('Other Dashboards'),
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
      placeholder={I18N.text('Search dashboard by name')}
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
