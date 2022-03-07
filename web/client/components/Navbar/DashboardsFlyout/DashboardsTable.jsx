// @flow

import * as React from 'react';

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

const TEXT = t('common.DashboardsFlyout.DashboardsTable');

export const DASHBOARD_TABLE_HEADERS: $ReadOnlyArray<
  TableHeader<DashboardMeta>,
> = [
  {
    id: 'title',
    displayContent: TEXT.columns.title,
    style: { width: '65%' },
    sortFn: Table.Sort.string<DashboardMeta>(dashboard => dashboard.title()),
    searchable: (dashboard: DashboardMeta) => dashboard.title(),
  },
  {
    id: 'lastAccessedByCurrentUser',
    displayContent: TEXT.columns.lastAccessedByCurrentUser,
    style: { width: '25%' },
    sortFn: Table.Sort.moment<DashboardMeta>(dashboard =>
      dashboard.lastAccessedByCurrentUser(),
    ),
  },
  {
    id: 'isFavorite',
    centerHeader: true,
    displayContent: <Icon type="star" />,
    sortFn: Table.Sort.boolean<DashboardMeta>(dashboard =>
      dashboard.isFavorite(),
    ),
    secondarySortKeys: ['lastAccessedByCurrentUser'],
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
        : TEXT.never;

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

  const noDataText = dashboardsLoaded ? TEXT.empty : TEXT.loading;

  return (
    <Table
      data={dashboards}
      headers={DASHBOARD_TABLE_HEADERS}
      initialColumnSortOrder={Table.SortDirections.DESC}
      initialColumnToSort="isFavorite"
      renderActionButtons={renderActionButtons}
      noDataText={noDataText}
      onRowClick={onDashboardRowClicked}
      pageSize={5}
      renderRow={renderDashboardRow}
      searchText={searchText}
    />
  );
}

export default (React.memo(DashboardsTable): React.AbstractComponent<Props>);
