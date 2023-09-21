// @flow

import * as React from 'react';

import CreateDashboardButton from 'components/common/CreateDashboardButton';
import FavoriteDashboardCell from 'components/Overview/FavoriteDashboardCell';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
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
        : I18N.text('Never');

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
        className="overview-page-dashboard-table"
        data={[]}
        headers={DASHBOARD_TABLE_HEADERS}
        noDataText={I18N.text('Dashboards are loading...')}
        renderRow={renderDashboardRow}
        searchText={searchText}
      />
    );
  }

  if (
    dashboards.length === 0 &&
    dashboardTabName === I18N.textById('My Dashboards')
  ) {
    return (
      <Group.Horizontal
        alignItems="center"
        className="overview-empty-state"
        flex
        justifyContent="center"
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
            {I18N.text('No dashboards yet')}
          </Heading.Large>
          <div className="overview-empty-state__subtitle">
            {I18N.text('Looks like you haven’t created any dashboards.')}
          </div>
          <div className="overview-empty-state__other-dashboards-tip">
            {I18N.text(
              'Check out Other Dashboards for dashboards that have been shared with you.',
            )}
          </div>
          <CreateDashboardButton />
        </Group.Vertical>
      </Group.Horizontal>
    );
  }

  return (
    <Table
      className="overview-page-dashboard-table"
      data={dashboards}
      headers={DASHBOARD_TABLE_HEADERS}
      initialColumnSortOrder={Table.SortDirections.DESC}
      initialColumnToSort="isFavorite"
      noDataText={I18N.textById('There are no Dashboards')}
      onRowClick={onDashboardRowClicked}
      pageSize={5}
      renderRow={renderDashboardRow}
      searchText={searchText}
    />
  );
}

export default (React.memo(DashboardTable): React.AbstractComponent<Props>);
