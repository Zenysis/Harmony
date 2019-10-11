// @flow
import Table from 'components/ui/Table';
import type AlertNotification from 'models/AlertsApp/AlertNotification';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import type Moment from 'models/core/wip/DateTime/Moment';

export type QueryTableRow = {
  indicators: string,
  granularity: string,
  startDate: moment$Moment,
  endDate: moment$Moment,
  url: string,
};

const TEXT = t('OverviewApp');
const DATE_FORMAT: string = 'D MMM YYYY';

export function formatDate(date: Moment): string {
  if (date.isValid()) {
    return date.format(DATE_FORMAT);
  }
  return '';
}

export const DASHBOARD_TABLE_HEADERS = [
  {
    id: 'title',
    displayContent: TEXT.dashboards.columns.title,
    style: { width: '40%' },
    sortFn: Table.Sort.string<DashboardMeta>(d => d.title()),
    searchable: (d: DashboardMeta) => d.title(),
  },
  {
    id: 'lastAccessedByCurrentUser',
    displayContent: TEXT.dashboards.columns.lastAccessedByCurrentUser,
    sortFn: Table.Sort.moment<DashboardMeta>(d =>
      d.lastAccessedByCurrentUser(),
    ),
    secondarySortKeys: ['created'],
  },
  {
    id: 'lastModifiedByCurrentUser',
    displayContent: TEXT.dashboards.columns.lastModifiedByCurrentUser,
    sortFn: Table.Sort.moment<DashboardMeta>(d =>
      d.lastModifiedByCurrentUser(),
    ),
  },
  {
    id: 'created',
    displayContent: TEXT.dashboards.columns.created,
    sortFn: Table.Sort.moment<DashboardMeta>(d => d.created()),
  },
  {
    id: 'totalViews',
    displayContent: TEXT.dashboards.columns.totalViews,
    sortFn: Table.Sort.number<DashboardMeta>(d => d.totalViews()),
  },
  {
    id: 'totalViewsByUser',
    displayContent: TEXT.dashboards.columns.totalViewsByUser,
    sortFn: Table.Sort.number<DashboardMeta>(d => d.totalViewsByUser()),
  },
  {
    id: 'isFavorite',
    centerHeader: true,
    displayContent: TEXT.dashboards.columns.isFavorite,
    sortFn: Table.Sort.boolean<DashboardMeta>(d => d.isFavorite()),
  },
];

export const QUERY_TABLE_HEADERS = [
  {
    id: 'indicators',
    displayContent: TEXT.queries.columns.indicators,
    style: { width: '45%' },
    sortFn: Table.Sort.string<QueryTableRow>(queryRow => queryRow.indicators),
  },
  {
    id: 'granularity',
    displayContent: TEXT.queries.columns.granularity,
  },
  {
    id: 'startDate',
    displayContent: TEXT.queries.columns.startDate,
  },
  {
    id: 'endDate',
    displayContent: TEXT.queries.columns.endDate,
  },
];

export const ALERT_TABLE_HEADERS = [
  {
    id: 'fieldName',
    displayContent: TEXT.alerts.columns.fieldName,
    style: { width: '45%' },
    searchable: (alert: AlertNotification) => alert.fieldName(),
  },
  {
    id: 'message',
    displayContent: TEXT.alerts.columns.message,
  },
  {
    id: 'dimensionDisplayName',
    displayContent: TEXT.alerts.columns.dimensionDisplayName,
  },
];
