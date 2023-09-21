// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Dropdown from 'components/ui/Dropdown';
import GroupRow from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/DashboardUsersTable/GroupRow';
import I18N from 'lib/I18N';
import IdentityRoleMap from 'services/models/IdentityRoleMap';
import InfoTooltip from 'components/ui/InfoTooltip';
import Role from 'services/models/Role';
import SecurityGroup from 'services/models/SecurityGroup';
import Table from 'components/ui/Table';
import Toaster from 'components/ui/Toaster';
import User from 'services/models/User';
import UserRow from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/DashboardUsersTable/UserRow';
import { RESOURCE_ROLE_MAP } from 'services/AuthorizationService/registry';

const MAX_ICON_LENGTH = 3;

const COMMON_HEADERS = [
  {
    displayContent: I18N.textById('Name'),
    id: 'name',
    searchable: u =>
      u instanceof User
        ? u.getUserFullName()
        : Zen.cast<SecurityGroup>(u).name(),
  },
  {
    displayContent: I18N.textById('Email'),
    id: 'email',
    searchable: u => (u instanceof User ? u.username() : ''),
  },
];

const CURRENT_USER = window.__JSON_FROM_BACKEND.user;

const HEADERS = [
  ...COMMON_HEADERS,
  { displayContent: I18N.textById('Role'), id: 'role' },
  { displayContent: '', id: 'actions', style: { width: 30 } },
];

// TODO - Convert all the properties that deal with roles
// to use the new `Role` ZenModel
type Props = {
  fetchedGroups: boolean,

  fetchedUsers: boolean,
  // A listing of all possible groups.
  groups: $ReadOnlyArray<SecurityGroup>,

  // A mapping of group names to an array of role names indicating which roles
  // the group holds.
  groupToRoles: IdentityRoleMap,

  // The default role that new users will be assigned in the dropdown.
  newUserRole: string,

  onGroupRolesUpdated: IdentityRoleMap => void,

  onUserRolesUpdated: IdentityRoleMap => void,

  // A listing of all possible users.
  users: Zen.Array<User>,

  // A mapping of usernames to an array of role names indicating which roles
  // the user holds.
  userToRoles: IdentityRoleMap,
};

function getUserLabel(user: User) {
  const username = user.username();
  const fullName = user.getUserFullName();
  return fullName ? `${fullName} - ${username}` : username;
}

export default function DashboardUsersTable({
  fetchedGroups,
  fetchedUsers,
  groupToRoles,
  groups,
  newUserRole,
  onGroupRolesUpdated,
  onUserRolesUpdated,
  userToRoles,
  users,
}: Props): React.Node {
  const getUsernameToUserMapping = React.useCallback((): Zen.Map<User> => {
    return Zen.Map.fromArray(users, 'username');
  }, [users]);

  const getNameToGroupMapping = React.useCallback((): Zen.Map<SecurityGroup> => {
    return Zen.Map.fromArray(groups, 'name');
  }, [groups]);

  const getTableData = (): $ReadOnlyArray<SecurityGroup | User> => {
    const userRows = [];
    if (userToRoles) {
      userToRoles
        .roles()
        .keys()
        .forEach(username => {
          const user = getUsernameToUserMapping().get(username);
          if (user) {
            userRows.push(user);
          }
        });
    }

    const groupRows = [];
    if (groupToRoles) {
      groupToRoles
        .roles()
        .keys()
        .forEach(name => {
          const group = getNameToGroupMapping().get(name);
          if (group) {
            groupRows.push(group);
          }
        });
    }
    return userRows.concat(groupRows);
  };

  /**
   * Only allow user or group deletion or role update if there will exist at
   * least 1 dashboard admin post update/deletion.
   */
  const validateUserOrGroupRemoval = (name: string): boolean => {
    const groupAdmins = groupToRoles
      .roles()
      .filter(
        (roles, key) =>
          key !== name &&
          roles
            .filter(
              role => role.roleName() === RESOURCE_ROLE_MAP.DASHBOARD_ADMIN,
            )
            .size() > 0,
      );
    const userAdmins = userToRoles
      .roles()
      .filter(
        (roles, key) =>
          key !== name &&
          roles
            .filter(
              role => role.roleName() === RESOURCE_ROLE_MAP.DASHBOARD_ADMIN,
            )
            .size() > 0,
      );
    return groupAdmins.size() + userAdmins.size() > 0;
  };

  const updateGroupRoles = (username: string, newRoleName: string) => {
    // Do not update if this is the only admin user/group.
    if (!validateUserOrGroupRemoval(username)) {
      Toaster.error(
        I18N.text(
          'This group is the only Dashboard Admin so their role cannot be updated. You will need to add another Dashboard Admin first.',
          'groupRemoveAdminRoleError',
        ),
      );
      return;
    }

    let updatedGroupToRoles = groupToRoles;
    const { resourceName } = updatedGroupToRoles.modelValues();

    // First delete all existing roles.
    updatedGroupToRoles = updatedGroupToRoles.deleteAllRoles(username);

    // Add new role
    updatedGroupToRoles = updatedGroupToRoles.addRole(
      username,
      Role.create({
        resourceName,
        resourceType: 'DASHBOARD',
        roleName: newRoleName,
      }),
    );
    onGroupRolesUpdated(updatedGroupToRoles);
  };

  const updateUserRoles = (username: string, newRoleName: string) => {
    // Do not update if this is the only admin user/group.
    if (!validateUserOrGroupRemoval(username)) {
      Toaster.error(
        I18N.text(
          'This user is the only Dashboard Admin so their role cannot be updated. You will need to add another Dashboard Admin first.',
          'userRemoveAdminRoleError',
        ),
      );
      return;
    }

    let updatedUserToRoles = userToRoles;
    const { resourceName } = updatedUserToRoles.modelValues();

    // First delete all existing roles.
    updatedUserToRoles = updatedUserToRoles.deleteAllRoles(username);

    // Add new role
    updatedUserToRoles = updatedUserToRoles.addRole(
      username,
      Role.create({
        resourceName,
        resourceType: 'DASHBOARD',
        roleName: newRoleName,
      }),
    );
    onUserRolesUpdated(updatedUserToRoles);
  };

  const onUserSelected = (username: string) => {
    const role = Role.create({
      resourceName: userToRoles.resourceName(),
      resourceType: 'USER',
      roleName: newUserRole,
    });
    onUserRolesUpdated(userToRoles.addRole(username, role));
  };

  const onGroupSelected = (groupName: string) => {
    const role = Role.create({
      resourceName: groupToRoles.resourceName(),
      resourceType: 'GROUP',
      roleName: newUserRole,
    });
    onGroupRolesUpdated(groupToRoles.addRole(groupName, role));
  };

  const onDropdownSelected = (value: User | SecurityGroup) => {
    if (value instanceof User) {
      onUserSelected(value.username());
    } else {
      onGroupSelected(Zen.cast<SecurityGroup>(value).name());
    }
  };

  const onGroupRemoved = (group: SecurityGroup) => {
    const name = group.name();
    onGroupRolesUpdated(groupToRoles.deleteAllRoles(name));
  };

  const onUserRemoved = (user: User) => {
    const { username } = user.modelValues();
    onUserRolesUpdated(userToRoles.deleteAllRoles(username));
  };

  const renderUserInfoToolTip = (
    group: SecurityGroup,
  ): React.Element<typeof InfoTooltip> => {
    const usernames = group
      .users()
      .map(user => user.username())
      .toArray();
    const numUsernames = usernames.length;
    let displayText = usernames.join(', ');

    if (numUsernames > MAX_ICON_LENGTH) {
      displayText = usernames
        .slice(0, MAX_ICON_LENGTH)
        .join(', ')
        .concat(` and ${numUsernames - MAX_ICON_LENGTH} more`);
    }
    return <InfoTooltip iconType="user" text={displayText} />;
  };

  const renderDropdown = (): ?React.Element<typeof Dropdown> => {
    if (!userToRoles && !groupToRoles) {
      return null;
    }

    // Do not show users that are already selected
    const userOptions = users
      .filter(user => userToRoles.getRoles(user.username()).isEmpty())
      .map(user => {
        const label = getUserLabel(user);
        return (
          <Dropdown.Option key={label} searchableText={label} value={user}>
            {label}
          </Dropdown.Option>
        );
      });

    const groupOptions = groups
      .filter(group => {
        const groupUsers = group.users().map(user => user.username());
        const groupNotSelected = groupToRoles.getRoles(group.name()).isEmpty();
        // Only show groups that
        // (1) haven't been selected
        // (2) groups that contain current user or all groups if current user is
        // an admin.
        const isUserInGroup =
          groupUsers.includes(CURRENT_USER.username) || CURRENT_USER.isAdmin;
        return isUserInGroup && groupNotSelected;
      })
      .map(group => {
        const groupName = group.name();
        return (
          <Dropdown.Option
            key={groupName}
            searchableText={groupName}
            value={group}
          >
            {groupName}
            {renderUserInfoToolTip(group)}
          </Dropdown.Option>
        );
      });

    const options = userOptions.push(groupOptions).toArray();

    return (
      <Dropdown
        defaultDisplayContent={I18N.text('Add users and groups')}
        enableSearch
        onSelectionChange={onDropdownSelected}
        optionsLoading={!fetchedGroups || !fetchedUsers}
        value={undefined}
      >
        {options}
      </Dropdown>
    );
  };

  const renderSingleRow = (
    item: User | SecurityGroup,
  ): React.Element<typeof Table.Row> => {
    if (item instanceof User) {
      const userItem = Zen.cast<User>(item);
      const username = userItem.username();
      const userRoles = userToRoles.roles().get(username, Zen.Array.create());
      const disableRemove = !validateUserOrGroupRemoval(username);
      return (
        <Table.Row id={username}>
          <UserRow
            disableRemove={disableRemove}
            disableRemoveText={I18N.text(
              'This user is the only Dashboard Admin so they cannot be removed. You will need to add another Dashboard Admin first.',
              'userRemoveButtonColDisabledText',
            )}
            onRemoveClick={onUserRemoved}
            onUserRoleChange={updateUserRoles}
            user={userItem}
            userRoles={userRoles}
          />
        </Table.Row>
      );
    }

    const groupItem = Zen.cast<SecurityGroup>(item);
    const groupName = groupItem.name();
    const groupRoles = groupToRoles.roles().get(groupName, Zen.Array.create());
    const disableRemove = !validateUserOrGroupRemoval(groupName);
    return (
      <Table.Row id={groupName}>
        <GroupRow
          disableRemove={disableRemove}
          disableRemoveText={I18N.text(
            'This group is the only Dashboard Admin so they cannot be removed. You will need to add another Dashboard Admin first.',
            'groupRemoveButtonColDisabledText',
          )}
          displayUserInfoToolTip={renderUserInfoToolTip}
          group={groupItem}
          groupRoles={groupRoles}
          onGroupRoleChange={updateGroupRoles}
          onRemoveClick={onGroupRemoved}
        />
      </Table.Row>
    );
  };

  const data = getTableData();

  return (
    <div className="gd-dashboard-users-table">
      <div className="gd-dashboard-users-table__dropdown">
        {renderDropdown()}
      </div>
      <div className="gd-dashboard-users-table__table">
        <Table
          adjustWidthsToContent
          data={data}
          headers={HEADERS}
          initialColumnToSort="name"
          renderRow={renderSingleRow}
          rowsLoading={!fetchedGroups || !fetchedUsers}
        />
      </div>
    </div>
  );
}
