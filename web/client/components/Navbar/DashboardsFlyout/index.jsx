// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Button from 'components/ui/Button';
import DashboardsTable from 'components/Navbar/DashboardsFlyout/DashboardsTable';
import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';
import Tab from 'components/ui/Tabs/Tab';
import Tabs from 'components/ui/Tabs';
import { RESOURCE_ROLE_MAP } from 'services/AuthorizationService/registry';
import { isMobileView } from 'components/Navbar/util';
import { partition } from 'util/arrayUtil';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';

type Props = {
  activeUsername: string,
  canCreateDashboards: boolean,
  dashboards: Zen.Array<DashboardMeta>,
  dashboardsLoaded: boolean,
  onNewDashboardClick: () => void,
  onUpdateDashboardIsFavorite: (
    dashboard: DashboardMeta,
    isFavorite: boolean,
  ) => void,
};

function DashboardsFlyout({
  activeUsername,
  canCreateDashboards,
  dashboards,
  dashboardsLoaded,
  onNewDashboardClick,
  onUpdateDashboardIsFavorite,
}: Props) {
  const [searchText, setSearchText] = React.useState<string>('');
  const [selectedTab, setSelectedTab] = React.useState<string>(
    I18N.textById('My Dashboards'),
  );

  const maybeRenderNewDashboardButton = () => {
    if (!canCreateDashboards) {
      return null;
    }

    return (
      <div className="navbar-dashboards-flyout__add-dashboard-button-container">
        <Button
          className="navbar-dashboards-flyout__add-dashboard-button"
          onClick={onNewDashboardClick}
          outline
          testId="new-dashboard-option"
        >
          <span>{I18N.textById('Create Dashboard')}</span>
        </Button>
      </div>
    );
  };

  const renderTab = (
    tabName: string,
    tabDashboards: $ReadOnlyArray<DashboardMeta>,
  ) => {
    const renderTableActionButtons = !isMobileView()
      ? maybeRenderNewDashboardButton
      : () => null;

    return (
      <Tab key={tabName} name={tabName}>
        <InputText
          className="navbar-dashboards-flyout__search-box"
          icon="search"
          onChange={setSearchText}
          placeholder={I18N.textById('Search dashboard by name')}
          value={searchText}
        />
        <DashboardsTable
          dashboards={tabDashboards}
          dashboardsLoaded={dashboardsLoaded}
          onUpdateDashboardIsFavorite={onUpdateDashboardIsFavorite}
          renderActionButtons={renderTableActionButtons}
          searchText={searchText}
        />
        {isMobileView() && maybeRenderNewDashboardButton()}
      </Tab>
    );
  };

  const [myDashboards, otherDashboards] = React.useMemo(
    () =>
      partition(
        dashboards.arrayView(),
        dashboard =>
          (dashboard.author() === activeUsername &&
            !!dashboard.myRoles().length) ||
          dashboard.myRoles().indexOf(RESOURCE_ROLE_MAP.DASHBOARD_ADMIN) >= 0,
      ),
    [dashboards, activeUsername],
  );

  React.useEffect(() => {
    // Default to "Other Dashboards" if user has no dashboards.
    if (myDashboards.length === 0) {
      setSelectedTab(I18N.textById('Other Dashboards'));
    }
    // NOTE: We deliberately only run this hook when the dashboards are
    // first loaded as we are only setting the initial default tab
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardsLoaded]);

  const tabHeaderSpacing = isMobileView() ? 16 : 32;

  return (
    <div className="navbar-dashboards-flyout">
      <Tabs.Controlled
        contentsClassName="navbar-dashboards-flyout__tab-contents"
        onTabChange={setSelectedTab}
        selectedTab={selectedTab}
        tabHeaderSpacing={tabHeaderSpacing}
      >
        {renderTab(I18N.textById('My Dashboards'), myDashboards)}
        {renderTab(I18N.textById('Other Dashboards'), otherDashboards)}
      </Tabs.Controlled>
    </div>
  );
}

export default (React.memo(DashboardsFlyout): React.AbstractComponent<Props>);
