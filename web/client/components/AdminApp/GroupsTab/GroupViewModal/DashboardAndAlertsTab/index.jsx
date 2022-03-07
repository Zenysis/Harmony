// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import AlertDefinition from 'models/AlertsApp/AlertDefinition';
import DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import RemoveItemButton from 'components/ui/RemoveItemButton';
import Table from 'components/ui/Table';
import { RESOURCE_TYPES } from 'services/AuthorizationService/registry';
import {
  createDropOptions,
  SINGLE_ALERT_OPTIONS_MAP,
  SINGLE_DASHBOARD_OPTIONS_MAP,
} from 'components/AdminApp/constants';
import { formatDate } from 'components/AdminApp/AccessSelectionView/AddDashboardView';
import { localizeUrl, onLinkClicked } from 'components/Navbar/util';
import type ItemLevelACL from 'services/models/ItemLevelACL';

type Props = {
  alertACLs: $ReadOnlyArray<ItemLevelACL>,
  dashboardACLs: $ReadOnlyArray<ItemLevelACL>,
  dashboardSlugToDashboardMap: Zen.Map<DashboardMeta>,
  onAddAlertClick: () => void,
  onAddDashboardClick: () => void,
  onAlertACLsUpdate: (acls: $ReadOnlyArray<ItemLevelACL>) => void,
  onDashboardACLsUpdate: (acls: $ReadOnlyArray<ItemLevelACL>) => void,
  resourceURIToAlertMap: Zen.Map<AlertDefinition>,
};

const TEXT = t('admin_app.GroupsTab.GroupViewModal.DashboardAndAlertsTab');

const alertDropOptions = createDropOptions(SINGLE_ALERT_OPTIONS_MAP);
const dashDropOptions = createDropOptions(SINGLE_DASHBOARD_OPTIONS_MAP);

type MergedAlertAndItemACLsType = {
  alert: AlertDefinition,
  itemACL: ItemLevelACL,
};
type MergedDashboardAndItemACLsType = {
  dashboard: DashboardMeta,
  itemACL: ItemLevelACL,
};

function mergeAlertAndItemACL(
  alertACLs: $ReadOnlyArray<ItemLevelACL>,
  resourceURIToAlertMap: Zen.Map<AlertDefinition>,
): Array<MergedAlertAndItemACLsType> {
  return alertACLs.map(acl => ({
    alert: resourceURIToAlertMap.forceGet(acl.resource().uri()),
    itemACL: acl,
  }));
}

function mergeDashboardAndItemACL(
  dashboardACLs: $ReadOnlyArray<ItemLevelACL>,
  dashboardSlugToDashboardMap: Zen.Map<DashboardMeta>,
): Array<MergedDashboardAndItemACLsType> {
  return dashboardACLs.map(acl => ({
    dashboard: dashboardSlugToDashboardMap.forceGet(acl.resource().name()),
    itemACL: acl,
  }));
}

const TABLE_PAGE_SIZE = 6;

const DASHBOARD_HEADERS = [
  {
    id: 'name',
    displayContent: TEXT.name,
    searchable: d => d.dashboard.title(),
    sortFn: Table.Sort.string(d => d.dashboard.title()),
  },
  {
    id: 'views',
    displayContent: TEXT.views,
    searchable: d => `${d.dashboard.totalViews()}`,
    sortFn: Table.Sort.number(d => d.dashboard.totalViews()),
  },
  {
    id: 'dateCreated',
    displayContent: TEXT.dateCreated,
    searchable: d => formatDate(d.dashboard.created()),
    sortFn: Table.Sort.string(d => formatDate(d.dashboard.created())),
  },
  {
    id: 'accessControl',
    displayContent: TEXT.accessControl,
    searchable: d => d.itemACL.resourceRole().name(),
    sortFn: Table.Sort.string(d => d.itemACL.resourceRole().name()),
  },
];

const ALERT_HEADERS = [
  {
    id: 'name',
    displayContent: TEXT.name,
    searchable: d => d.itemACL.resource().name(),
    sortFn: Table.Sort.string(d => d.itemACL.resource().name()),
  },
  {
    id: 'dimension',
    displayContent: TEXT.dimension,
    searchable: d => d.alert.getReadableDimension(),
    sortFn: Table.Sort.string(d => d.alert.getReadableDimension()),
  },
  {
    id: 'duration',
    displayContent: TEXT.duration,
    searchable: d => d.alert.timeGranularity(),
    sortFn: Table.Sort.string(d => d.alert.timeGranularity()),
  },
  {
    id: 'accessControl',
    displayContent: TEXT.accessControl,
    searchable: d => d.itemACL.resourceRole().name(),
    sortFn: Table.Sort.string(d => d.itemACL.resourceRole().name()),
  },
];

export function getIdFromUri(uri: string): number {
  return Number(uri.split('/').pop());
}

const isAlertsEnabled = window.__JSON_FROM_BACKEND.alertsEnabled;

export default function DashboardAndAlertsTab({
  alertACLs,
  dashboardACLs,
  dashboardSlugToDashboardMap,
  onAddAlertClick,
  onAddDashboardClick,
  onAlertACLsUpdate,
  onDashboardACLsUpdate,
  resourceURIToAlertMap,
}: Props): React.Element<typeof Group.Vertical> {
  const onDropdownSelectionChange = (
    newAccessControl,
    itemACL,
    resourceType,
  ) => {
    if (resourceType === RESOURCE_TYPES.ALERT) {
      const updatedItemACLs = alertACLs.map(acl => {
        if (acl.resource().name() === itemACL.resource().name()) {
          const resourceRole = newAccessControl;
          return acl
            .deepUpdate()
            .resourceRole()
            .name(resourceRole);
        }
        return acl;
      });
      onAlertACLsUpdate(updatedItemACLs);
    } else {
      const updatedItemACLs = dashboardACLs.map(acl => {
        if (acl.resource().name() === itemACL.resource().name()) {
          const resourceRole = newAccessControl;
          return acl
            .deepUpdate()
            .resourceRole()
            .name(resourceRole);
        }
        return acl;
      });
      onDashboardACLsUpdate(updatedItemACLs);
    }
  };

  const renderAlertTableRow = mergedAlertAndItemACLs => {
    const { alert, itemACL } = mergedAlertAndItemACLs;
    const onACLRemove = () =>
      onAlertACLsUpdate(
        alertACLs.filter(
          acl =>
            acl.resource().uri() !== itemACL.resource().uri() ||
            acl.resource().resourceType() !==
              itemACL.resource().resourceType() ||
            acl.resourceRole().name() !== itemACL.resourceRole().name(),
        ),
      );
    const resource = itemACL.resource();
    return (
      <Table.Row id={itemACL.uri()}>
        <Table.Cell>{resource.label()}</Table.Cell>
        <Table.Cell>{alert.getReadableDimension()}</Table.Cell>
        <Table.Cell>{alert.timeGranularity()}</Table.Cell>
        <Table.Cell>
          <Dropdown
            onSelectionChange={val =>
              onDropdownSelectionChange(val, itemACL, RESOURCE_TYPES.ALERT)
            }
            value={itemACL.resourceRole().name()}
          >
            {alertDropOptions}
          </Dropdown>
        </Table.Cell>
        <Table.Cell>
          <RemoveItemButton
            className="group-view-modal__remove-icon"
            onClick={onACLRemove}
          />
        </Table.Cell>
      </Table.Row>
    );
  };

  const renderDashboardTableRow = mergedDashboardAndItemACLs => {
    const { dashboard, itemACL } = mergedDashboardAndItemACLs;
    const onACLRemove = () => {
      onDashboardACLsUpdate(
        dashboardACLs.filter(
          acl =>
            acl.resource().name() !== itemACL.resource().name() ||
            acl.resource().resourceType() !==
              itemACL.resource().resourceType() ||
            acl.resourceRole().name() !== itemACL.resourceRole().name(),
        ),
      );
    };
    return (
      <Table.Row id={itemACL.uri()}>
        <Table.Cell>
          <div
            className="group-view-modal__dashboard-label-link"
            onClick={(_, event) =>
              onLinkClicked(
                localizeUrl(`/dashboard/${dashboard.slug()}`),
                event,
                undefined,
                undefined,
                true,
              )
            }
            role="button"
          >
            {itemACL.resource().label()}
          </div>
        </Table.Cell>
        <Table.Cell>{`${dashboard.totalViews()}`}</Table.Cell>
        <Table.Cell>{formatDate(dashboard.created())}</Table.Cell>
        <Table.Cell>
          <Dropdown
            onSelectionChange={val =>
              onDropdownSelectionChange(val, itemACL, RESOURCE_TYPES.DASHBOARD)
            }
            value={itemACL.resourceRole().name()}
          >
            {dashDropOptions}
          </Dropdown>
        </Table.Cell>
        <Table.Cell>
          <RemoveItemButton
            className="group-view-modal__remove-icon"
            onClick={onACLRemove}
          />
        </Table.Cell>
      </Table.Row>
    );
  };

  const dashboardTableData = React.useMemo(
    () => mergeDashboardAndItemACL(dashboardACLs, dashboardSlugToDashboardMap),
    [dashboardACLs, dashboardSlugToDashboardMap],
  );

  const alertTableData = React.useMemo(
    () => mergeAlertAndItemACL(alertACLs, resourceURIToAlertMap),
    [alertACLs, resourceURIToAlertMap],
  );

  const dashboardSection = (
    <Group.Vertical spacing="m">
      <Group.Horizontal flex lastItemStyle={{ marginLeft: 'auto' }}>
        <Heading size={Heading.Sizes.SMALL}>{TEXT.dashboards}</Heading>
        <button
          className="group-view-modal__add-button"
          onClick={onAddDashboardClick}
          type="button"
        >
          {TEXT.addDashboards}
        </button>
      </Group.Horizontal>
      <div className="group-view-modal__header" />
      <Table
        adjustWidthsToContent
        className="group-view-modal__table"
        data={dashboardTableData}
        headers={DASHBOARD_HEADERS}
        initialColumnToSort="name"
        initialColumnSortOrder="ASC"
        pageSize={TABLE_PAGE_SIZE}
        renderRow={renderDashboardTableRow}
      />
    </Group.Vertical>
  );

  const alertSection = (
    <Group.Vertical spacing="m">
      <Group.Horizontal
        flex
        lastItemStyle={{ marginLeft: 'auto' }}
        paddingTop="xl"
        style={{ borderTop: '1px solid #eee' }}
      >
        <Heading size={Heading.Sizes.SMALL}>{TEXT.alerts}</Heading>
        <button
          className="group-view-modal__add-button"
          onClick={onAddAlertClick}
          type="button"
        >
          {TEXT.addAlerts}
        </button>
      </Group.Horizontal>
      <div className="group-view-modal__header" />
      <Table
        adjustWidthsToContent
        className="group-view-modal__table"
        data={alertTableData}
        headers={ALERT_HEADERS}
        initialColumnToSort="name"
        initialColumnSortOrder="ASC"
        pageSize={TABLE_PAGE_SIZE}
        renderRow={renderAlertTableRow}
      />
    </Group.Vertical>
  );

  return (
    <Group.Vertical spacing="xxl">
      {dashboardSection}
      {isAlertsEnabled && alertSection}
    </Group.Vertical>
  );
}
