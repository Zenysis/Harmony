// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import QueryResultSpec from 'models/core/QueryResultSpec';
import QuerySessionService from 'services/QuerySessionService';
import Table from 'components/ui/Table';
import {
  AQT_DEFAULT_VIEW_TYPE,
  AQT_RESULT_VIEW_ORDER,
} from 'components/AdvancedQueryApp/registry/viewTypes';
import { DEFAULT_VISUALIZATION_TYPE } from 'models/AdvancedQueryApp/VisualizationType/registry';
import { SESSION_SOURCES } from 'models/AdvancedQueryApp/QuerySession';
import { localizeUrl, onLinkClicked } from 'components/Navbar/util';
import type AlertDefinition from 'models/AlertsApp/AlertDefinition';
import type AlertNotification from 'models/AlertsApp/AlertNotification';

type Props = {
  alertNotifs: $ReadOnlyArray<AlertNotification>,
  alertDefs: $ReadOnlyArray<AlertDefinition>,
};

function formatDimensionString(alertNotif: AlertNotification) {
  const { dimensionDisplayName, dimensionValue } = alertNotif.modelValues();
  return `${dimensionValue} (${dimensionDisplayName})`;
}

const TABLE_HEADERS = [
  {
    id: 'name',
    displayContent: I18N.textById('Name'),
    searchable: alert => alert.title(),
  },
  {
    id: 'dimensionValue',
    displayContent: I18N.text('Group By Values'),
    searchable: alert => formatDimensionString(alert),
  },
  {
    id: 'triggerRule',
    displayContent: I18N.text('Trigger'),
    searchable: alert => alert.getNotificationMessage(),
  },
  {
    id: 'timeFrequency',
    displayContent: I18N.textById('Time Frequency'),
    headerClassName: 'alerts-app__table-frequency-header',
    searchable: alert => alert.getReadableFrequency(),
  },
  {
    id: 'queryInterval',
    displayContent: '',
    searchable: alert => alert.getReadableQueryInterval(),
  },
];

function renderSingleAlertNotifRow(
  alertNotif: AlertNotification,
): React.Element<typeof Table.Row> {
  // Gets row for a single notification
  const dimensionLocation = formatDimensionString(alertNotif);
  const triggerRule = alertNotif.getNotificationMessage();
  const timeFrequency = alertNotif.getReadableFrequency();
  const { title } = alertNotif.modelValues();
  const queryInterval = alertNotif.getReadableQueryInterval();
  const tableKey = alertNotif.uri();

  return (
    <Table.Row id={tableKey}>
      <Table.Cell>{title}</Table.Cell>
      <Table.Cell>{dimensionLocation}</Table.Cell>
      <Table.Cell>{triggerRule}</Table.Cell>
      <Table.Cell>{timeFrequency}</Table.Cell>
      <Table.Cell className="alerts-app__notification-table-action-column">
        {queryInterval}
      </Table.Cell>
    </Table.Row>
  );
}

export default function AlertNotifsTab({
  alertNotifs,
  alertDefs,
}: Props): React.Node {
  const alertDefinitionLookup: {
    [alertNotificationUri: string]: AlertDefinition,
  } = React.useMemo(() => {
    const lookup = {};
    alertDefs.forEach(alertDef => {
      lookup[alertDef.uri()] = alertDef;
    });

    return lookup;
  }, [alertDefs]);

  const onRowClick = (alertNotif: AlertNotification) => {
    const alertDefinitionUri = alertNotif.alertDefinitionUri();
    const alertDefinition = alertDefinitionLookup[alertDefinitionUri];

    alertNotif.buildQuerySelections(alertDefinition).then(querySelections => {
      const queryResultSpec = QueryResultSpec.fromQuerySelections(
        AQT_RESULT_VIEW_ORDER,
        querySelections,
      );

      // Generate AQT share link
      QuerySessionService.storeQuerySession(
        queryResultSpec,
        querySelections,
        AQT_DEFAULT_VIEW_TYPE,
        DEFAULT_VISUALIZATION_TYPE,
        window.__JSON_FROM_BACKEND.user.id,
        SESSION_SOURCES.NEW,
      ).then(queryHash => {
        const url = localizeUrl(`/advanced-query#h=${queryHash}`);
        onLinkClicked(
          url,
          undefined,
          'Alert Notification query clicked',
          { url },
          true,
        );
      });
    });
  };

  return (
    <Table
      adjustWidthsToContent
      data={alertNotifs}
      renderRow={renderSingleAlertNotifRow}
      onRowClick={onRowClick}
      headers={TABLE_HEADERS}
      noDataText={I18N.text('There are no Alert Notifications')}
    />
  );
}
