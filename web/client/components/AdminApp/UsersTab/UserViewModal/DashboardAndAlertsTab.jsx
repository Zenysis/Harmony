// @flow
import * as React from 'react';

import AccessLevelTabs from 'components/AdminApp/UsersTab/UserViewModal/AccessLevelTabs';
import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import InteractivePill from 'components/AdminApp/InteractivePill';
import RemoveItemButton from 'components/ui/RemoveItemButton';
import Tab from 'components/ui/Tabs/Tab';
import Table from 'components/ui/Table';
import Tooltip from 'components/ui/Tooltip';
import { RESOURCE_TYPES } from 'services/AuthorizationService/registry';
import {
  SINGLE_ALERT_OPTIONS_MAP,
  SINGLE_DASHBOARD_OPTIONS_MAP,
  createDropOptions,
} from 'components/AdminApp/constants';
import { localizeUrl, onLinkClicked } from 'components/Navbar/util';
import { noop } from 'util/util';
import type ItemLevelACL from 'services/models/ItemLevelACL';
import type User from 'services/models/User';
import type { GroupACLPair } from 'components/AdminApp/constants';

type Props = {
  groupDashboardACLs: $ReadOnlyArray<GroupACLPair>,
  groupAlertACLs: $ReadOnlyArray<GroupACLPair>,
  onAddAlertClick: () => void,
  onAddDashboardClick: () => void,
  updateUserAlertACLs: (alertACLs: $ReadOnlyArray<ItemLevelACL>) => void,
  updateUserDashboardACLs: (
    dashboardACLs: $ReadOnlyArray<ItemLevelACL>,
  ) => void,
  user: User,
  userAlertACLs: $ReadOnlyArray<ItemLevelACL>,
  userDashboardACLs: $ReadOnlyArray<ItemLevelACL>,
};

const TABLE_PAGE_SIZE = 5;
const TEXT_PATH = 'admin_app.UsersTab.UserViewModal.DashboardAndAlertsTab';
const TEXT = t(TEXT_PATH);
const ACCESS_TEXT = t('admin_app.UsersTab.UserViewModal.AccessLevelTabs');
const DELETE_ICON_CLASSNAME = 'user-view-modal__delete-button';

const GROUP_HEADERS = [
  {
    id: 'dashboardName',
    displayContent: TEXT.dashboardName,
    searchable: pair => pair.acl.resource().label(),
    sortFn: Table.Sort.string(pair => pair.acl.resource().label()),
  },
  {
    id: 'accessFrom',
    displayContent: TEXT.accessGrantedHeader,
    searchable: pair => pair.group.name(),
    sortFn: Table.Sort.string(pair => pair.group.name()),
  },
  {
    id: 'accessControl',
    displayContent: TEXT.accessControl,
    searchable: pair => pair.acl.resourceRole().name(),
    sortFn: Table.Sort.string(pair => pair.acl.resourceRole().name()),
  },
];
const USER_HEADERS = [
  {
    id: 'dashboardName',
    displayContent: TEXT.dashboardName,
    searchable: acl => acl.resource().label(),
    sortFn: Table.Sort.string(acl => acl.resource().label()),
  },
  {
    id: 'accessControl',
    displayContent: TEXT.accessControl,
    searchable: acl => acl.resourceRole().name(),
    sortFn: Table.Sort.string(acl => acl.resourceRole().name()),
  },
];

const alertDropOptions = createDropOptions(SINGLE_ALERT_OPTIONS_MAP);
const dashDropOptions = createDropOptions(SINGLE_DASHBOARD_OPTIONS_MAP);

const isAlertsEnabled = window.__JSON_FROM_BACKEND.alertsEnabled;

export default function DashboardAndAlertsTab({
  groupDashboardACLs,
  groupAlertACLs,
  onAddAlertClick,
  onAddDashboardClick,
  updateUserAlertACLs,
  updateUserDashboardACLs,
  user,
  userAlertACLs,
  userDashboardACLs,
}: Props): React.Element<typeof Group.Vertical> {
  const addDashboardsButton = (
    <div
      className="user-view-modal__add-button"
      onClick={onAddDashboardClick}
      role="button"
    >
      {TEXT.addDashboards}
    </div>
  );

  const addAlertsButton = (
    <div
      className="user-view-modal__add-button"
      onClick={onAddAlertClick}
      role="button"
    >
      {TEXT.addAlerts}
    </div>
  );

  const onDropdownSelectionChange = (
    newAccessControl,
    itemACL,
    resourceType,
  ) => {
    const isAlertType = resourceType === RESOURCE_TYPES.ALERT;
    const acls = isAlertType ? userAlertACLs : userDashboardACLs;
    const onACLUpdate = isAlertType
      ? updateUserAlertACLs
      : updateUserDashboardACLs;

    const updatedItemACLs = acls.map(acl => {
      if (acl.resource().name() === itemACL.resource().name()) {
        const resourceRole = newAccessControl;
        return acl
          .deepUpdate()
          .resourceRole()
          .name(resourceRole);
      }
      return acl;
    });
    onACLUpdate(updatedItemACLs);
  };

  const renderSingleUserRow = acl => {
    const isDashboard =
      acl.resource().resourceType() === RESOURCE_TYPES.DASHBOARD;
    const curDropdownVal = acl.resourceRole().name();
    const resource = acl.resource();
    const onRemoveAlert = () => {
      updateUserAlertACLs(
        userAlertACLs.filter(
          a => a.resource().name() !== acl.resource().name(),
        ),
      );
    };
    const onRemoveDashboard = () => {
      updateUserDashboardACLs(
        userDashboardACLs.filter(
          a => a.resource().name() !== acl.resource().name(),
        ),
      );
    };
    const onRemoveFn = isDashboard ? onRemoveDashboard : onRemoveAlert;

    const mainContent = isDashboard ? (
      <div
        className="user-view-modal__dashboard-label-link"
        onClick={(_, event) =>
          onLinkClicked(
            localizeUrl(`/dashboard/${resource.name()}`),
            event,
            undefined,
            undefined,
            true,
          )
        }
        role="button"
      >
        {resource.label()}
      </div>
    ) : (
      resource.label()
    );

    return (
      <Table.Row id={resource.name()}>
        <Table.Cell>{mainContent}</Table.Cell>
        <Table.Cell>
          <Dropdown
            onSelectionChange={newVal =>
              onDropdownSelectionChange(
                newVal,
                acl,
                acl.resource().resourceType(),
              )
            }
            value={curDropdownVal}
          >
            {isDashboard ? dashDropOptions : alertDropOptions}
          </Dropdown>
        </Table.Cell>
        <Table.Cell>
          <RemoveItemButton
            className={DELETE_ICON_CLASSNAME}
            onClick={onRemoveFn}
          />
        </Table.Cell>
      </Table.Row>
    );
  };

  const renderSingleGroupRow = pair => {
    const { acl, group } = pair;
    const resource = acl.resource();
    const isDashboard = resource.resourceType() === RESOURCE_TYPES.DASHBOARD;
    const disableDeleteStr = isDashboard
      ? 'disableDashboardRemovalTooltip'
      : 'disableAlertRemovalTooltip';
    const disableDropdownStr = isDashboard
      ? 'disableDashboardDropdownTooltip'
      : 'disableAlertDropdownTooltip';

    const mainContent = isDashboard ? (
      <div
        className="user-view-modal__dashboard-label-link"
        onClick={(_, event) =>
          onLinkClicked(
            localizeUrl(`/dashboard/${resource.name()}`),
            event,
            undefined,
            undefined,
            true,
          )
        }
        role="button"
      >
        {resource.label()}
      </div>
    ) : (
      resource.label()
    );

    return (
      <Table.Row id={`${resource.name()}-${group.name()}`}>
        <Table.Cell>{mainContent}</Table.Cell>
        <Table.Cell>
          <Tooltip
            content={t(disableDropdownStr, {
              username: user.username(),
              groupName: group.name(),
              scope: TEXT_PATH,
            })}
          >
            <Dropdown
              disableSelect
              onSelectionChange={noop}
              value={acl.resourceRole().name()}
            >
              {isDashboard ? dashDropOptions : alertDropOptions}
            </Dropdown>
          </Tooltip>
        </Table.Cell>
        <Table.Cell>
          <Group.Horizontal>
            {TEXT.accessThrough}
            <InteractivePill pillType="group" group={group} />
          </Group.Horizontal>
        </Table.Cell>
        <Table.Cell>
          <RemoveItemButton
            className={DELETE_ICON_CLASSNAME}
            tooltipPlacement="bottom"
            tooltipText={t(disableDeleteStr, {
              username: user.username(),
              groupName: group.name(),
              scope: TEXT_PATH,
            })}
          />
        </Table.Cell>
      </Table.Row>
    );
  };

  const userDashboardsTable = (
    <Table
      adjustWidthsToContent
      className="user-view-modal__table"
      data={userDashboardACLs}
      headers={USER_HEADERS}
      initialColumnToSort="dashboardName"
      initialColumnSortOrder="ASC"
      pageSize={TABLE_PAGE_SIZE}
      renderRow={renderSingleUserRow}
    />
  );

  const groupDashboardsTable = (
    <Table
      adjustWidthsToContent
      className="user-view-modal__table"
      data={groupDashboardACLs}
      headers={GROUP_HEADERS}
      initialColumnToSort="dashboardName"
      initialColumnSortOrder="ASC"
      pageSize={TABLE_PAGE_SIZE}
      renderRow={renderSingleGroupRow}
    />
  );

  const dashboardTabs = (
    <AccessLevelTabs>
      <Tab name={ACCESS_TEXT.userAccess}>{userDashboardsTable}</Tab>
      <Tab name={ACCESS_TEXT.groupAccess}>{groupDashboardsTable}</Tab>
    </AccessLevelTabs>
  );

  const dashboardsBlock = (
    <Group.Vertical spacing="none">
      <Group.Horizontal flex justifyContent="space-between">
        <Heading size={Heading.Sizes.SMALL} style={{ marginBottom: '0px' }}>
          {TEXT.dashboardTitle}
        </Heading>
        {addDashboardsButton}
      </Group.Horizontal>
      {dashboardTabs}
    </Group.Vertical>
  );

  const userAlertsTable = (
    <Table
      adjustWidthsToContent
      className="user-view-modal__table"
      data={userAlertACLs}
      headers={USER_HEADERS}
      initialColumnToSort="dashboardName"
      initialColumnSortOrder="ASC"
      pageSize={TABLE_PAGE_SIZE}
      renderRow={renderSingleUserRow}
    />
  );

  const groupAlertsTable = (
    <Table
      adjustWidthsToContent
      className="user-view-modal__table"
      data={groupAlertACLs}
      headers={GROUP_HEADERS}
      initialColumnToSort="dashboardName"
      initialColumnSortOrder="ASC"
      pageSize={TABLE_PAGE_SIZE}
      renderRow={renderSingleGroupRow}
    />
  );

  const alertTabs = (
    <AccessLevelTabs>
      <Tab name={ACCESS_TEXT.userAccess}>{userAlertsTable}</Tab>
      <Tab name={ACCESS_TEXT.groupAccess}>{groupAlertsTable}</Tab>
    </AccessLevelTabs>
  );

  const alertsBlock = (
    <Group.Vertical
      paddingTop="l"
      spacing="none"
      style={{ borderTop: '1px solid #eee' }}
    >
      <Group.Horizontal flex justifyContent="space-between">
        <Heading size={Heading.Sizes.SMALL} style={{ marginBottom: '0px' }}>
          {TEXT.alertTitle}
        </Heading>
        {addAlertsButton}
      </Group.Horizontal>
      {alertTabs}
    </Group.Vertical>
  );

  return (
    <Group.Vertical spacing="l">
      {dashboardsBlock}
      {isAlertsEnabled && alertsBlock}
    </Group.Vertical>
  );
}
