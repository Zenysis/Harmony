// @flow
import * as React from 'react';

import AccessLevelTabs from 'components/AdminApp/UsersTab/UserViewModal/AccessLevelTabs';
import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
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
  groupAlertACLs: $ReadOnlyArray<GroupACLPair>,
  groupDashboardACLs: $ReadOnlyArray<GroupACLPair>,
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
const DELETE_ICON_CLASSNAME = 'user-view-modal__delete-button';

const GROUP_HEADERS = [
  {
    displayContent: I18N.textById('Name'),
    id: 'dashboardName',
    searchable: pair => pair.acl.resource().label(),
    sortFn: Table.Sort.string(pair => pair.acl.resource().label()),
  },
  {
    displayContent: I18N.text('Access Granted'),
    id: 'accessFrom',
    searchable: pair => pair.group.name(),
    sortFn: Table.Sort.string(pair => pair.group.name()),
  },
  {
    displayContent: I18N.textById('Access Control'),
    id: 'accessControl',
    searchable: pair => pair.acl.resourceRole().name(),
    sortFn: Table.Sort.string(pair => pair.acl.resourceRole().name()),
  },
];
const USER_HEADERS = [
  {
    displayContent: I18N.textById('Name'),
    id: 'dashboardName',
    searchable: acl => acl.resource().label(),
    sortFn: Table.Sort.string(acl => acl.resource().label()),
  },
  {
    displayContent: I18N.textById('Access Control'),
    id: 'accessControl',
    searchable: acl => acl.resourceRole().name(),
    sortFn: Table.Sort.string(acl => acl.resourceRole().name()),
  },
];

const alertDropOptions = createDropOptions(SINGLE_ALERT_OPTIONS_MAP);
const dashDropOptions = createDropOptions(SINGLE_DASHBOARD_OPTIONS_MAP);

const isAlertsEnabled = window.__JSON_FROM_BACKEND.alertsEnabled;

export default function DashboardAndAlertsTab({
  groupAlertACLs,
  groupDashboardACLs,
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
      {I18N.text('+ Add Dashboards')}
    </div>
  );

  const addAlertsButton = (
    <div
      className="user-view-modal__add-button"
      onClick={onAddAlertClick}
      role="button"
    >
      {I18N.text('+ Add Alerts')}
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
    const userAndGroupInfo = {
      groupName: group.name(),
      username: user.username(),
    };

    const mainContent = isDashboard ? (
      <div
        className="user-view-modal__dashboard-label-link"
        onClick={(_, event) =>
          onLinkClicked(
            localizeUrl(`/dashboard/${resource.name()}`),
            event,
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
            content={
              isDashboard
                ? I18N.text(
                    '%(username)s has access to this dashboard through the %(groupName)s group. To change, you will have to modify access from %(groupName)s',
                    userAndGroupInfo,
                  )
                : I18N.text(
                    '%(username)s has access to this alert through the %(groupName)s group. To change, you will have to modify access from %(groupName)s',
                    userAndGroupInfo,
                  )
            }
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
            {I18N.text('Added Through')}
            <InteractivePill group={group} pillType="group" />
          </Group.Horizontal>
        </Table.Cell>
        <Table.Cell>
          <RemoveItemButton
            className={DELETE_ICON_CLASSNAME}
            tooltipPlacement="bottom"
            tooltipText={
              isDashboard
                ? I18N.text(
                    '%(username)s has access to this dashboard through the %(groupName)s group. To delete, you will have to remove %(username)s from %(groupName)s',
                    userAndGroupInfo,
                  )
                : I18N.text(
                    '%(username)s has access to this alert through the %(groupName)s group. To delete, you will have to remove %(username)s from %(groupName)s',
                    userAndGroupInfo,
                  )
            }
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
      initialColumnSortOrder="ASC"
      initialColumnToSort="dashboardName"
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
      initialColumnSortOrder="ASC"
      initialColumnToSort="dashboardName"
      pageSize={TABLE_PAGE_SIZE}
      renderRow={renderSingleGroupRow}
    />
  );

  const dashboardTabs = (
    <AccessLevelTabs>
      <Tab name={I18N.textById('Direct Access')}>{userDashboardsTable}</Tab>
      <Tab name={I18N.text('Group Access')}>{groupDashboardsTable}</Tab>
    </AccessLevelTabs>
  );

  const dashboardsBlock = (
    <Group.Vertical spacing="none">
      <Group.Horizontal flex justifyContent="space-between">
        <Heading size={Heading.Sizes.SMALL} style={{ marginBottom: '0px' }}>
          {I18N.textById('Dashboards')}
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
      initialColumnSortOrder="ASC"
      initialColumnToSort="dashboardName"
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
      initialColumnSortOrder="ASC"
      initialColumnToSort="dashboardName"
      pageSize={TABLE_PAGE_SIZE}
      renderRow={renderSingleGroupRow}
    />
  );

  const alertTabs = (
    <AccessLevelTabs>
      <Tab name={I18N.textById('Direct Access')}>{userAlertsTable}</Tab>
      <Tab name={I18N.textById('Group Access')}>{groupAlertsTable}</Tab>
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
          {I18N.textById('Alerts')}
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
