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
import { autobind, memoizeOne } from 'decorators';

const TEXT = t(
  'GridDashboardApp.GridDashboardControls.DashboardSettingsModal.DashboardUsersTable',
);
const TABLE_TEXT = TEXT.tableText;

const MAX_ICON_LENGTH = 3;

const COMMON_HEADERS = [
  {
    id: 'name',
    displayContent: TABLE_TEXT.name,
    searchable: u =>
      u instanceof User
        ? u.getUserFullName()
        : Zen.cast<SecurityGroup>(u).name(),
  },
  {
    id: 'email',
    displayContent: TABLE_TEXT.email,
    searchable: u => (u instanceof User ? u.username() : ''),
  },
];

const CURRENT_USER = window.__JSON_FROM_BACKEND.user;

const HEADERS = [
  ...COMMON_HEADERS,
  { id: 'role', displayContent: TABLE_TEXT.role },
  { id: 'actions', displayContent: '', style: { width: 30 } },
];

// TODO(vedant) - Convert all the properties that deal with roles
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

  // A listing of all possible roles
  roles: $ReadOnlyArray<string>,
};

function getUserLabel(user: User) {
  const username = user.username();
  const fullName = user.getUserFullName();
  return fullName ? `${fullName} - ${username}` : username;
}

export default class DashboardUsersTable extends React.PureComponent<Props> {
  getTableData(): $ReadOnlyArray<SecurityGroup | User> {
    const { groups, groupToRoles, userToRoles, users } = this.props;
    const userRows = [];
    if (userToRoles) {
      userToRoles
        .roles()
        .keys()
        .forEach(username => {
          const user = this.getUsernameToUserMapping(users).get(username);
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
          const group = this.getNameToGroupMapping(groups).get(name);
          if (group) {
            groupRows.push(group);
          }
        });
    }
    return userRows.concat(groupRows);
  }

  @memoizeOne
  getUsernameToUserMapping(users: Zen.Array<User>): Zen.Map<User> {
    return Zen.Map.fromArray(users, 'username');
  }

  @memoizeOne
  getNameToGroupMapping(
    groups: $ReadOnlyArray<SecurityGroup>,
  ): Zen.Map<SecurityGroup> {
    return Zen.Map.fromArray(groups, 'name');
  }

  /**
   * Only allow user or group deletion or role update if there will exist at
   * least 1 dashboard admin post update/deletion.
   */
  @autobind
  validateUserOrGroupRemoval(name: string): boolean {
    const { groupToRoles, userToRoles } = this.props;
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
  }

  @autobind
  updateGroupRoles(username: string, newRoleName: string) {
    // Do not update if this is the only admin user/group.
    if (!this.validateUserOrGroupRemoval(username)) {
      Toaster.error(
        I18N.text(
          'This group is the only Dashboard Admin so their role cannot be updated. You will need to add another Dashboard Admin first.',
          'groupRemoveAdminRoleError',
        ),
      );
      return;
    }

    let updatedGroupToRoles = this.props.groupToRoles;
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
    this.onGroupRolesUpdated(updatedGroupToRoles);
    window.analytics.track('Dashboard group role updated', {
      dashboardName: resourceName,
      groupUpdated: username,
    });
  }

  @autobind
  updateUserRoles(username: string, newRoleName: string) {
    // Do not update if this is the only admin user/group.
    if (!this.validateUserOrGroupRemoval(username)) {
      Toaster.error(
        I18N.text(
          'This user is the only Dashboard Admin so their role cannot be updated. You will need to add another Dashboard Admin first.',
          'userRemoveAdminRoleError',
        ),
      );
      return;
    }

    let updatedUserToRoles = this.props.userToRoles;
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
    this.onUserRolesUpdated(updatedUserToRoles);
    window.analytics.track('Dashboard user role updated', {
      dashboardName: resourceName,
      userUpdated: username,
    });
  }

  @autobind
  onDropdownSelected(value: User | SecurityGroup) {
    if (value instanceof User) {
      this.onUserSelected(value.username());
    } else {
      this.onGroupSelected(Zen.cast<SecurityGroup>(value).name());
    }
  }

  @autobind
  onGroupSelected(groupName: string) {
    const { newUserRole, groupToRoles } = this.props;

    const role = Role.create({
      resourceName: groupToRoles.resourceName(),
      resourceType: 'GROUP',
      roleName: newUserRole,
    });
    this.onGroupRolesUpdated(groupToRoles.addRole(groupName, role));
  }

  @autobind
  onGroupRemoved(group: SecurityGroup) {
    const { groupToRoles } = this.props;
    const name = group.name();
    this.onGroupRolesUpdated(groupToRoles.deleteAllRoles(name));
    window.analytics.track('Dashboard group removed', {
      dashboardName: groupToRoles.resourceName(),
      groupRemoved: name,
    });
  }

  @autobind
  onGroupRolesUpdated(groupToRoles: IdentityRoleMap) {
    const { onGroupRolesUpdated } = this.props;
    if (onGroupRolesUpdated !== undefined) {
      onGroupRolesUpdated(groupToRoles);
    }
  }

  @autobind
  onUserSelected(username: string) {
    const { newUserRole, userToRoles } = this.props;

    const role = Role.create({
      resourceName: userToRoles.resourceName(),
      resourceType: 'USER',
      roleName: newUserRole,
    });
    this.onUserRolesUpdated(userToRoles.addRole(username, role));
  }

  @autobind
  onUserRemoved(user: User) {
    const { userToRoles } = this.props;
    const { username } = user.modelValues();
    this.onUserRolesUpdated(userToRoles.deleteAllRoles(username));
    window.analytics.track('Dashboard user removed', {
      dashboardName: userToRoles.resourceName(),
      userRemoved: username,
    });
  }

  onUserRolesUpdated(userToRoles: IdentityRoleMap) {
    this.props.onUserRolesUpdated(userToRoles);
  }

  renderUserInfoToolTip(
    group: SecurityGroup,
  ): React.Element<typeof InfoTooltip> {
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
  }

  renderDropdown(): ?React.Element<typeof Dropdown> {
    const {
      fetchedGroups,
      fetchedUsers,
      groups,
      groupToRoles,
      userToRoles,
      users,
    } = this.props;

    if (!userToRoles && !groupToRoles) {
      return null;
    }

    // Do not show users that are already selected
    const userOptions = users
      .filter(user => userToRoles.getRoles(user.username()).isEmpty())
      .map(user => {
        const label = getUserLabel(user);
        return (
          <Dropdown.Option key={label} value={user} searchableText={label}>
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
            value={group}
            searchableText={groupName}
          >
            {groupName}
            {this.renderUserInfoToolTip(group)}
          </Dropdown.Option>
        );
      });

    const options = userOptions.push(groupOptions).toArray();

    return (
      <Dropdown
        optionsLoading={!fetchedGroups || !fetchedUsers}
        value={undefined}
        onSelectionChange={this.onDropdownSelected}
        defaultDisplayContent={TEXT.dropdownTitle}
        enableSearch
      >
        {options}
      </Dropdown>
    );
  }

  @autobind
  renderSingleRow(item: User | SecurityGroup): React.Element<typeof Table.Row> {
    const { groupToRoles, roles, userToRoles } = this.props;

    if (item instanceof User) {
      const userItem = Zen.cast<User>(item);
      const username = userItem.username();
      const userRoles = userToRoles.roles().get(username, Zen.Array.create());
      const disableRemove = !this.validateUserOrGroupRemoval(username);
      return (
        <Table.Row id={username}>
          <UserRow
            disableRemove={disableRemove}
            disableRemoveText={I18N.text(
              'This user is the only Dashboard Admin so they cannot be removed. You will need to add another Dashboard Admin first.',
              'userRemoveButtonColDisabledText',
            )}
            onUserRoleChange={this.updateUserRoles}
            onRemoveClick={this.onUserRemoved}
            userRoles={userRoles}
            roles={roles}
            user={userItem}
          />
        </Table.Row>
      );
    }

    const groupItem = Zen.cast<SecurityGroup>(item);
    const groupName = groupItem.name();
    const groupRoles = groupToRoles.roles().get(groupName, Zen.Array.create());
    const disableRemove = !this.validateUserOrGroupRemoval(groupName);
    return (
      <Table.Row id={groupName}>
        <GroupRow
          disableRemove={disableRemove}
          disableRemoveText={I18N.text(
            'This group is the only Dashboard Admin so they cannot be removed. You will need to add another Dashboard Admin first.',
            'groupRemoveButtonColDisabledText',
          )}
          onGroupRoleChange={this.updateGroupRoles}
          onRemoveClick={this.onGroupRemoved}
          groupRoles={groupRoles}
          roles={roles}
          group={groupItem}
          displayUserInfoToolTip={this.renderUserInfoToolTip}
        />
      </Table.Row>
    );
  }

  render(): React.Node {
    const { fetchedGroups, fetchedUsers } = this.props;
    const data = this.getTableData();

    return (
      <div className="gd-dashboard-users-table">
        <div className="gd-dashboard-users-table__dropdown">
          {this.renderDropdown()}
        </div>
        <div className="gd-dashboard-users-table__table">
          <Table
            adjustWidthsToContent
            data={data}
            headers={HEADERS}
            initialColumnToSort="name"
            renderRow={this.renderSingleRow}
            rowsLoading={!fetchedGroups || !fetchedUsers}
          />
        </div>
      </div>
    );
  }
}
