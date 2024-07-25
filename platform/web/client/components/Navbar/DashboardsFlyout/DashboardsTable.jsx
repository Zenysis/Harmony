// @flow

import * as React from 'react';

import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import Table from 'components/ui/Table';
import { localizeUrl, onLinkClicked } from 'components/Navbar/util';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import type { TableHeader } from 'components/ui/Table';

type Props = {
  dashboards: $ReadOnlyArray<DashboardMeta>,
  dashboardsLoaded: boolean,
  onUpdateDashboardIsFavorite: (
    dashboard: DashboardMeta,
    isFavorite: boolean,
  ) => void,
  renderActionButtons: () => React.Node,
  searchText: string,
};

const DATE_FORMAT: string = 'D MMM YYYY';

export const DASHBOARD_TABLE_HEADERS: $ReadOnlyArray<
  TableHeader<DashboardMeta>,
> = [
  {
    displayContent: I18N.textById('Name'),
    id: 'title',
    searchable: (dashboard: DashboardMeta) => dashboard.title(),
    sortFn: Table.Sort.string<DashboardMeta>(dashboard => dashboard.title()),
    style: { width: '65%' },
  },
  {
    displayContent: I18N.textById('My Last Visit'),
    id: 'lastAccessedByCurrentUser',
    sortFn: Table.Sort.moment<DashboardMeta>(dashboard =>
      dashboard.lastAccessedByCurrentUser(),
    ),
    style: { width: '25%' },
  },
  {
    centerHeader: true,
    displayContent: <Icon type="star" />,
    id: 'isFavorite',
    secondarySortKeys: ['lastAccessedByCurrentUser'],
    sortFn: Table.Sort.boolean<DashboardMeta>(dashboard =>
      dashboard.isFavorite(),
    ),
  },
];

function DashboardsTable({
  dashboards,
  dashboardsLoaded,
  onUpdateDashboardIsFavorite,
  renderActionButtons,
  searchText,
}: Props) {
  const onDashboardRowClicked = (
    dashboardMeta: DashboardMeta,
    rowIndex: number,
    event: SyntheticEvent<HTMLTableRowElement>,
  ) => {
    onLinkClicked(localizeUrl(`/dashboard/${dashboardMeta.slug()}`), event);
  };

  const renderDashboardRow = (dashboard: DashboardMeta) => {
    const {
      isFavorite,
      lastAccessedByCurrentUser,
      totalViewsByUser,
    } = dashboard.modelValues();

    const favoriteIconType = isFavorite ? 'star' : 'star-empty';

    const onFavouriteCellClick = (event: SyntheticEvent<HTMLSpanElement>) => {
      event.stopPropagation();
      onUpdateDashboardIsFavorite(dashboard, !dashboard.isFavorite());
    };

    const lastVisitedDate =
      lastAccessedByCurrentUser.isValid() && totalViewsByUser > 0
        ? lastAccessedByCurrentUser.format(DATE_FORMAT)
        : I18N.textById('Never');

    return (
      <Table.Row id={dashboard.slug()}>
        <Table.Cell testId="dashboards-flyout-table-title-cell">
          {dashboard.title()}
        </Table.Cell>
        <Table.Cell>{lastVisitedDate}</Table.Cell>
        <Table.Cell className="navbar-dashboards-flyout__table-is-favorite-cell">
          <Icon onClick={onFavouriteCellClick} type={favoriteIconType} />
        </Table.Cell>
      </Table.Row>
    );
  };

  const noDataText = dashboardsLoaded
    ? I18N.textById('There are no Dashboards')
    : I18N.textById('Dashboards are loading...');

  return (
    <Table
      data={dashboards}
      headers={DASHBOARD_TABLE_HEADERS}
      initialColumnSortOrder={Table.SortDirections.DESC}
      initialColumnToSort="isFavorite"
      noDataText={noDataText}
      onRowClick={onDashboardRowClicked}
      pageSize={5}
      renderActionButtons={renderActionButtons}
      renderRow={renderDashboardRow}
      searchText={searchText}
    />
  );
}

export default (React.memo(DashboardsTable): React.AbstractComponent<Props>);
