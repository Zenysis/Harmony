// @flow
import * as React from 'react';

import AccessLevelTabs from 'components/AdminApp/UsersTab/UserViewModal/AccessLevelTabs';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
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
  userGroupRoles: $ReadOnlyArray<GroupWithRoles>,
  userGroups: $ReadOnlyArray<SecurityGroup>,
  userRoles: $ReadOnlyArray<RoleDefinition>,
};

const TABLE_PAGE_SIZE = 5;
const REMOVE_ICON_CLASSNAME = 'user-view-modal__delete-button';

const GROUP_HEADERS = [
  {
    displayContent: I18N.text('Group'),
    id: 'groupName',
    searchable: g => g.name(),
    sortFn: Table.Sort.string(g => g.name()),
  },
];

const GROUP_ROLE_HEADERS = [
  {
    displayContent: I18N.textById('Role'),
    id: 'roleName',
    searchable: g => g.group.name(),
    sortFn: Table.Sort.string(g => g.group.name()),
  },
  {
    displayContent: I18N.textById('Access Granted'),
    id: 'accessFrom',
    searchable: g => g.role.label(),
    sortFn: Table.Sort.string(g => g.role.label()),
  },
];
const USER_ROLE_HEADERS = [
  {
    displayContent: I18N.textById('Role'),
    id: 'roleName',
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
  userGroupRoles,
  userGroups,
  userRoles,
}: Props): React.Element<typeof Group.Vertical> {
  const addRolesButton = (
    <div
      className="user-view-modal__add-button"
      onClick={onAddRoleClick}
      role="button"
    >
      {I18N.text('+ Add Roles')}
    </div>
  );

  const addGroupsButton = (
    <div
      className="user-view-modal__add-button"
      onClick={onAddGroupClick}
      role="button"
    >
      {I18N.text('+ Add Groups')}
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
      initialColumnSortOrder="ASC"
      initialColumnToSort="roleName"
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
          {I18N.textById('Added Through')}
          <InteractivePill group={dict.group} pillType="group" />
        </Group.Horizontal>
      </Table.Cell>
      <Table.Cell>
        <RemoveItemButton
          className={REMOVE_ICON_CLASSNAME}
          tooltipPlacement="bottom"
          tooltipText={I18N.text(
            '%(username)s has access to this role through the %(groupName)s group. To delete, you will have to remove %(username)s from %(groupName)s',
            {
              groupName: dict.group.name(),
              username: user.username(),
            },
          )}
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
      initialColumnSortOrder="ASC"
      initialColumnToSort="roleName"
      pageSize={TABLE_PAGE_SIZE}
      renderRow={renderSingleGroupRoleRow}
    />
  );

  const roleTabs = (
    <AccessLevelTabs>
      <Tab name={I18N.textById('Direct Access')}>{userRolesTable}</Tab>
      <Tab name={I18N.textById('Group Access')}>{groupRolesTable}</Tab>
    </AccessLevelTabs>
  );

  const rolesBlock = (
    <Group.Vertical spacing="none">
      <Group.Horizontal flex justifyContent="space-between">
        <Heading size={Heading.Sizes.SMALL} style={{ marginBottom: '0px' }}>
          {I18N.textById('Roles')}
        </Heading>
        {addRolesButton}
      </Group.Horizontal>
      {roleTabs}
    </Group.Vertical>
  );

  const renderSingleGroupRow = group => (
    <Table.Row id={group.name()}>
      <Table.Cell>
        <InteractivePill group={group} pillType="group" />
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
      initialColumnSortOrder="ASC"
      initialColumnToSort="groupName"
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
          {I18N.textById('Groups')}
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
