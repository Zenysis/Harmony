// @flow
import I18N from 'lib/I18N';
import Table from 'components/ui/Table';
import type AlertNotification from 'models/AlertsApp/AlertNotification';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import type Moment from 'models/core/wip/DateTime/Moment';
import type { TableHeader } from 'components/ui/Table';

const DATE_FORMAT: string = 'D MMM YYYY';

export function formatDate(date: Moment): string {
  if (date.isValid()) {
    return date.format(DATE_FORMAT);
  }
  return '';
}

export const DASHBOARD_TABLE_HEADERS: $ReadOnlyArray<
  TableHeader<DashboardMeta>,
> = [
  {
    displayContent: I18N.textById('Name'),
    id: 'title',
    searchable: (d: DashboardMeta) => d.title(),
    sortFn: Table.Sort.string<DashboardMeta>(d => d.title()),
    style: { width: '40%' },
  },
  {
    displayContent: I18N.text('My Last Visit'),
    id: 'lastAccessedByCurrentUser',
    sortFn: Table.Sort.moment<DashboardMeta>(d =>
      d.lastAccessedByCurrentUser(),
    ),
  },
  {
    displayContent: I18N.text('Created'),
    id: 'created',
    sortFn: Table.Sort.moment<DashboardMeta>(d => d.created()),
  },
  {
    displayContent: I18N.text('Views'),
    id: 'totalViews',
    sortFn: Table.Sort.number<DashboardMeta>(d => d.totalViews()),
    zenTestId: 'dashboard-table-views-header',
  },
  {
    centerHeader: true,
    displayContent: I18N.text('Favorite'),
    id: 'isFavorite',
    secondarySortKeys: ['lastAccessedByCurrentUser', 'totalViews'],
    sortFn: Table.Sort.boolean<DashboardMeta>(d => d.isFavorite()),
  },
];

export const ALERT_TABLE_HEADERS: $ReadOnlyArray<
  TableHeader<AlertNotification>,
> = [
  {
    displayContent: I18N.textById('Name'),
    id: 'name',
    searchable: (alert: AlertNotification) => alert.title(),
    style: { width: '45%' },
  },
  {
    displayContent: I18N.text('Message'),
    id: 'message',
  },
  {
    displayContent: I18N.textById('Dimension'),
    id: 'dimensionDisplayName',
  },
];
