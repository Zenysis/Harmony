// @flow

import * as React from 'react';

import CreateDashboardButton from 'components/common/CreateDashboardButton';
import FavoriteDashboardCell from 'components/Overview/FavoriteDashboardCell';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import Icon from 'components/ui/Icon';
import Table from 'components/ui/Table';
import { DASHBOARD_TABLE_HEADERS, formatDate } from 'components/Overview/util';
import { localizeUrl, onLinkClicked } from 'components/Navbar/util';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';

type Props = {
  dashboards: $ReadOnlyArray<DashboardMeta>,
  dashboardsLoaded: boolean,
  dashboardTabName: string,
  onUpdateDashboardIsFavorite?: (
    dashboard: DashboardMeta,
    isFavorite: boolean,
  ) => void,
  searchText: string,
};

const TEXT = t('OverviewApp.dashboards');

function DashboardTable({
  dashboards,
  dashboardsLoaded,
  dashboardTabName,
  onUpdateDashboardIsFavorite = undefined,
  searchText,
}: Props) {
  const onDashboardRowClicked = (
    dashboardMeta: DashboardMeta,
    rowIdx: number,
    e: SyntheticEvent<HTMLTableRowElement>,
  ) => {
    onLinkClicked(localizeUrl(`/dashboard/${dashboardMeta.slug()}`), e);
  };

  const renderDashboardRow = (dashboard: DashboardMeta) => {
    const lastVisitedDate =
      dashboard.lastAccessedByCurrentUser().isValid() &&
      dashboard.totalViewsByUser() > 0
        ? formatDate(dashboard.lastAccessedByCurrentUser())
        : TEXT.never;

    return (
      <Table.Row id={dashboard.slug()}>
        <Table.Cell>{dashboard.title()}</Table.Cell>
        <Table.Cell>{lastVisitedDate}</Table.Cell>
        <Table.Cell>{formatDate(dashboard.created())}</Table.Cell>
        <Table.Cell>{dashboard.totalViews()}</Table.Cell>
        <FavoriteDashboardCell
          dashboard={dashboard}
          onClick={onUpdateDashboardIsFavorite}
        />
      </Table.Row>
    );
  };

  if (!dashboardsLoaded) {
    return (
      <Table
        noDataText={TEXT.loading}
        className="overview-page-dashboard-table"
        data={[]}
        headers={DASHBOARD_TABLE_HEADERS}
        renderRow={renderDashboardRow}
        searchText={searchText}
      />
    );
  }

  if (dashboards.length === 0 && dashboardTabName === TEXT.userTabTitle) {
    return (
      <Group.Horizontal
        alignItems="center"
        flex
        justifyContent="center"
        className="overview-empty-state"
      >
        <Icon
          className="overview-empty-state__icon"
          type="svg-dashboard-with-background"
        />
        <Group.Vertical
          flex
          justifyContent="center"
          marginLeft="xl"
          spacing="none"
        >
          <Heading.Large className="overview-empty-state__title">
            {TEXT.emptyStateTitle}
          </Heading.Large>
          <div className="overview-empty-state__subtitle">
            {TEXT.emptyStateSubtitle}
          </div>
          <div className="overview-empty-state__other-dashboards-tip">
            {TEXT.emptyStateTip}
          </div>
          <CreateDashboardButton />
        </Group.Vertical>
      </Group.Horizontal>
    );
  }

  return (
    <Table
      noDataText={TEXT.empty}
      className="overview-page-dashboard-table"
      data={dashboards}
      headers={DASHBOARD_TABLE_HEADERS}
      renderRow={renderDashboardRow}
      onRowClick={onDashboardRowClicked}
      pageSize={5}
      initialColumnToSort="isFavorite"
      initialColumnSortOrder={Table.SortDirections.DESC}
      searchText={searchText}
    />
  );
}

export default (React.memo(DashboardTable): React.AbstractComponent<Props>);
