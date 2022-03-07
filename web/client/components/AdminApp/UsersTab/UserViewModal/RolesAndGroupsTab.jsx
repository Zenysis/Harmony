// @flow
import * as React from 'react';

import AccessLevelTabs from 'components/AdminApp/UsersTab/UserViewModal/AccessLevelTabs';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import InteractivePill from 'components/AdminApp/InteractivePill';
import RemoveItemButton from 'components/ui/RemoveItemButton';
import SecurityGroup from 'services/models/SecurityGroup';
import Tab from 'components/ui/Tabs/Tab';
import Table from 'components/ui/Table';
import type RoleDefinition from 'services/models/RoleDefinition';
import type User from 'services/models/User';
import type { GroupWithRoles } from 'components/AdminApp/constants';

type Props = {
  onAddGroupClick: () => void,
  onAddRoleClick: () => void,
  updateUserGroups: (userGroups: $ReadOnlyArray<SecurityGroup>) => void,
  updateUserRoles: (userRoles: $ReadOnlyArray<RoleDefinition>) => void,
  user: User,
  userGroups: $ReadOnlyArray<SecurityGroup>,
  userGroupRoles: $ReadOnlyArray<GroupWithRoles>,
  userRoles: $ReadOnlyArray<RoleDefinition>,
};

const TABLE_PAGE_SIZE = 5;
const TEXT_PATH = 'admin_app.UsersTab.UserViewModal.RolesAndGroupsTab';
const TEXT = t(TEXT_PATH);
const ACCESS_TEXT = t('admin_app.UsersTab.UserViewModal.AccessLevelTabs');
const REMOVE_ICON_CLASSNAME = 'user-view-modal__delete-button';

const GROUP_HEADERS = [
  {
    id: 'groupName',
    displayContent: TEXT.userRoleTableHeaderGroupName,
    searchable: g => g.name(),
    sortFn: Table.Sort.string(g => g.name()),
  },
];

const GROUP_ROLE_HEADERS = [
  {
    id: 'roleName',
    displayContent: TEXT.userRoleTableHeaderGroupRoleName,
    searchable: g => g.group.name(),
    sortFn: Table.Sort.string(g => g.group.name()),
  },
  {
    id: 'accessFrom',
    displayContent: TEXT.accessGrantedHeader,
    searchable: g => g.role.label(),
    sortFn: Table.Sort.string(g => g.role.label()),
  },
];
const USER_ROLE_HEADERS = [
  {
    id: 'roleName',
    displayContent: TEXT.userRoleTableHeaderRoleName,
    searchable: u => u.label(),
    sortFn: Table.Sort.string(u => u.label()),
  },
];

export default function RolesAndGroupsTab({
  onAddGroupClick,
  onAddRoleClick,
  updateUserGroups,
  updateUserRoles,
  user,
  userGroups,
  userGroupRoles,
  userRoles,
}: Props): React.Element<typeof Group.Vertical> {
  const addRolesButton = (
    <div
      className="user-view-modal__add-button"
      onClick={onAddRoleClick}
      role="button"
    >
      {TEXT.addRoles}
    </div>
  );

  const addGroupsButton = (
    <div
      className="user-view-modal__add-button"
      onClick={onAddGroupClick}
      role="button"
    >
      {TEXT.addGroups}
    </div>
  );

  const renderSingleUserRoleRow = role => {
    const onRemoveRole = () => {
      updateUserRoles(userRoles.filter(r => r.uri() !== role.uri()));
    };

    return (
      <Table.Row id={role.name()}>
        <Table.Cell>
          <InteractivePill pillType="role" role={role} />
        </Table.Cell>
        <Table.Cell>
          <RemoveItemButton
            className={REMOVE_ICON_CLASSNAME}
            onClick={onRemoveRole}
          />
        </Table.Cell>
      </Table.Row>
    );
  };

  const userRolesTable = (
    <Table
      adjustWidthsToContent
      className="user-view-modal__table"
      data={userRoles}
      headers={USER_ROLE_HEADERS}
      initialColumnToSort="roleName"
      initialColumnSortOrder="ASC"
      pageSize={TABLE_PAGE_SIZE}
      renderRow={renderSingleUserRoleRow}
    />
  );

  const renderSingleGroupRoleRow = dict => (
    <Table.Row id={`${dict.role.name()}-${dict.group.name()}`}>
      <Table.Cell>
        <InteractivePill pillType="role" role={dict.role} />
      </Table.Cell>
      <Table.Cell>
        <Group.Horizontal>
          {TEXT.accessThrough}
          <InteractivePill pillType="group" group={dict.group} />
        </Group.Horizontal>
      </Table.Cell>
      <Table.Cell>
        <RemoveItemButton
          className={REMOVE_ICON_CLASSNAME}
          tooltipPlacement="bottom"
          tooltipText={t('disableRoleRemovalTooltip', {
            username: user.username(),
            groupName: dict.group.name(),
            scope: TEXT_PATH,
          })}
        />
      </Table.Cell>
    </Table.Row>
  );

  const groupRolesTable = (
    <Table
      adjustWidthsToContent
      className="user-view-modal__table"
      data={userGroupRoles}
      headers={GROUP_ROLE_HEADERS}
      initialColumnToSort="roleName"
      initialColumnSortOrder="ASC"
      pageSize={TABLE_PAGE_SIZE}
      renderRow={renderSingleGroupRoleRow}
    />
  );

  const roleTabs = (
    <AccessLevelTabs>
      <Tab name={ACCESS_TEXT.userAccess}>{userRolesTable}</Tab>
      <Tab name={ACCESS_TEXT.groupAccess}>{groupRolesTable}</Tab>
    </AccessLevelTabs>
  );

  const rolesBlock = (
    <Group.Vertical spacing="none">
      <Group.Horizontal flex justifyContent="space-between">
        <Heading size={Heading.Sizes.SMALL} style={{ marginBottom: '0px' }}>
          {TEXT.roleTitle}
        </Heading>
        {addRolesButton}
      </Group.Horizontal>
      {roleTabs}
    </Group.Vertical>
  );

  const renderSingleGroupRow = group => (
    <Table.Row id={group.name()}>
      <Table.Cell>
        <InteractivePill pillType="group" group={group} />
      </Table.Cell>
      <Table.Cell>
        <RemoveItemButton
          className={REMOVE_ICON_CLASSNAME}
          onClick={() =>
            updateUserGroups(userGroups.filter(g => g.uri() !== group.uri()))
          }
        />
      </Table.Cell>
    </Table.Row>
  );

  const groupTable = (
    <Table
      adjustWidthsToContent
      className="user-view-modal__table"
      data={userGroups}
      headers={GROUP_HEADERS}
      initialColumnToSort="groupName"
      initialColumnSortOrder="ASC"
      pageSize={TABLE_PAGE_SIZE}
      renderRow={renderSingleGroupRow}
    />
  );

  const groupsBlock = (
    <Group.Vertical
      paddingTop="l"
      spacing="none"
      style={{ borderTop: '1px solid #eee' }}
    >
      <Group.Horizontal flex justifyContent="space-between">
        <Heading size={Heading.Sizes.SMALL} style={{ marginBottom: '0px' }}>
          {TEXT.groupTitle}
        </Heading>
        {addGroupsButton}
      </Group.Horizontal>
      {groupTable}
    </Group.Vertical>
  );

  return (
    <Group.Vertical spacing="l">
      {rolesBlock}
      {groupsBlock}
    </Group.Vertical>
  );
}
