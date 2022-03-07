// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Button from 'components/ui/Button';
import DashboardsTable from 'components/Navbar/DashboardsFlyout/DashboardsTable';
import InputText from 'components/ui/InputText';
import Tab from 'components/ui/Tabs/Tab';
import Tabs from 'components/ui/Tabs';
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

const TEXT = t('common.DashboardsFlyout');

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
    TEXT.myDashboards,
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
          <span>{TEXT.newDashboard}</span>
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
          placeholder={TEXT.searchPlaceholder}
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
        dashboard => dashboard.author() === activeUsername,
      ),
    [dashboards, activeUsername],
  );

  React.useEffect(() => {
    // Default to "Other Dashboards" if user has no dashboards.
    if (myDashboards.length === 0) {
      setSelectedTab(TEXT.otherDashboards);
    }
    // NOTE(david): We deliberately only run this hook when the dashboards are
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
        {canCreateDashboards
          ? renderTab(TEXT.myDashboards, myDashboards)
          : undefined}
        {renderTab(TEXT.otherDashboards, otherDashboards)}
      </Tabs.Controlled>
    </div>
  );
}

export default (React.memo(DashboardsFlyout): React.AbstractComponent<Props>);
