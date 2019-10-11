// @flow
import * as React from 'react';

import BootstrapSelect from 'components/bootstrap_select';
import IdentityRoleMap from 'services/models/IdentityRoleMap';
import Role from 'services/models/Role';
import Table from 'components/ui/Table';
import UserRow from 'components/common/UserSelect/UserRow';
import ZenArray from 'util/ZenModel/ZenArray';
import ZenMap from 'util/ZenModel/ZenMap';
import { USER_STATUS } from 'services/models/User';
import { autobind, memoizeOne } from 'decorators';
import type RoleDefinition from 'services/models/RoleDefinition';
import type User, { UserStatus } from 'services/models/User';
import type { ResourceType } from 'services/AuthorizationService';

const TEXT = t('common.user_select');

export const DEFAULT_STATUSES = [
  USER_STATUS.ACTIVE,
  USER_STATUS.INACTIVE,
  USER_STATUS.PENDING,
];

const COMMON_HEADERS = [
  {
    id: 'name',
    displayContent: TEXT.name,
    searchable: u => u.getUserFullName(),
  },
  { id: 'email', displayContent: TEXT.email, searchable: u => u.username() },
  {
    id: 'phoneNumber',
    displayContent: t('admin_app.userTableHeaders.phoneNumber'),
  },
  { id: 'status', displayContent: TEXT.status, searchable: u => u.status() },
];

const HEADERS = [
  ...COMMON_HEADERS,
  { id: 'role', displayContent: TEXT.role },
  { id: 'actions', displayContent: '', style: { width: 30 } },
];

const ROLELESS_HEADERS = [
  ...COMMON_HEADERS,
  { id: 'actions', displayContent: '', style: { width: 30 } },
];

// TODO(vedant) - Convert all the properties that deal with roles
// to use the new `Role` ZenModel
type Props = {
  onUserRolesUpdated: IdentityRoleMap => void,

  // A listing of all possible users.
  users: ZenArray<User>,

  // A mapping of usernames to an array of role names indicating which roles
  // the user holds.
  userToRoles: IdentityRoleMap,

  // The default role that new users will be assigned in the dropdown.
  // If not declared, the user will have to explictly select.
  // NOTE: This must be a role that is defined in the `roles` property.
  newUserRole: RoleDefinition | void,

  // Determines whether or not the Role columns should be rendered in this
  // control. If this property is disabled, then when `onUserRolesUpdated`
  // is called, there will be
  roleSelectionEnabled: boolean,

  // A listing of all possible roles
  roles: ZenArray<RoleDefinition>,

  // The title of the User Select Control
  title: string,

  // TODO(vedant) - I don't like this property, it's confusing and we should
  // just filter the list of users passed into this control rather than
  // filtering in such a haphazard fashion.
  //
  // Filters the list of available/selectable users based on their status.
  // For a user to appear in the selection dropdown, their status must be
  // one of the statuses defined in this property.
  userStatusFilter: $ReadOnlyArray<UserStatus>,
};

const NO_USER_SELECTION = '';

function getUserLabel(user: User) {
  const username = user.username();
  const fullName = user.getUserFullName();
  const label = fullName ? `${fullName} - ${username}` : username;
  return label;
}

function getUserDataTokens(user: User) {
  const dataTokens = [user.username(), user.firstName(), user.lastName()];
  return dataTokens.filter(token => !!token);
}

export default class UserSelect extends React.PureComponent<Props> {
  static defaultProps = {
    newUserRole: undefined,
    roleSelectionEnabled: true,
    roles: ZenArray.create<RoleDefinition>(),
    title: TEXT.default_title,
    userStatusFilter: DEFAULT_STATUSES,
  };

  @memoizeOne
  getUserStatusFilter(
    userStatusFilter: $ReadOnlyArray<UserStatus>,
  ): Set<UserStatus> {
    return new Set(userStatusFilter);
  }

  @memoizeOne
  getUsernameToUserMapping(users: ZenArray<User>): ZenMap<User> {
    return ZenMap.fromArray(users, 'username');
  }

  @autobind
  updateUserRoles(
    username: string,
    newRoleNames: $ReadOnlyArray<string>,
    resourceType: ResourceType,
  ) {
    let updatedUserToRoles = this.props.userToRoles;
    const { resourceName } = updatedUserToRoles.modelValues();

    // First delete all existing roles.
    updatedUserToRoles = updatedUserToRoles.deleteAllRoles(username);

    // Then add any new roles.
    newRoleNames.forEach(roleName => {
      const role = Role.create({
        resourceName,
        resourceType,
        roleName,
      });
      updatedUserToRoles = updatedUserToRoles.addRole(username, role);
    });
    this.onUserRolesUpdated(updatedUserToRoles);
  }

  @autobind
  onUserSelected(event: SyntheticEvent<HTMLSelectElement>) {
    const { newUserRole, userToRoles } = this.props;
    const username = event.currentTarget.value;
    const newRoleName = newUserRole ? newUserRole.name() : '';

    const role = Role.create({
      resourceName: userToRoles.resourceName(),
      resourceType: 'USER',
      roleName: newRoleName,
    });
    this.onUserRolesUpdated(userToRoles.addRole(username, role));
  }

  @autobind
  onUserRemoved(user: User) {
    const { userToRoles } = this.props;
    const { username } = user.modelValues();
    this.onUserRolesUpdated(userToRoles.deleteAllRoles(username));
  }

  onUserRolesUpdated(userToRoles: IdentityRoleMap) {
    this.props.onUserRolesUpdated(userToRoles);
  }

  renderUserDropdown() {
    const { userToRoles, users, userStatusFilter } = this.props;

    if (!userToRoles) {
      return null;
    }

    const options = users
      .filter(user => {
        const userAlreadySelected = !userToRoles
          .getRoles(user.username())
          .isEmpty();
        if (userAlreadySelected) {
          // Do not show users that are already selected
          return false;
        }

        const userStatus = user.status();
        if (
          userStatus &&
          !this.getUserStatusFilter(userStatusFilter).has(userStatus)
        ) {
          // Do not show users whose statuses do not match
          return false;
        }
        return true;
      })
      .map(user => {
        const label = getUserLabel(user);
        const dataTokens = getUserDataTokens(user);

        return (
          <option
            data-tokens={dataTokens.join(' ')}
            key={user.username()}
            value={user.username()}
          >
            {label}
          </option>
        );
      });

    return (
      <BootstrapSelect
        className="user-select-dropdown btn-group-xs input-medium"
        data-width="fit"
        title={this.props.title}
        value={NO_USER_SELECTION}
        onChange={this.onUserSelected}
        multiple={false}
        data-live-search
      >
        {options}
      </BootstrapSelect>
    );
  }

  @autobind
  renderSingleUserRow(user: User) {
    const userRoles = this.props.userToRoles
      .roles()
      .get(user.username(), ZenArray.create());
    return (
      <Table.Row id={`${user.status() || ''}-${user.username()}`}>
        <UserRow
          showRolesDropdown={this.props.roleSelectionEnabled}
          onUserRoleChange={this.updateUserRoles}
          onRemoveClick={this.onUserRemoved}
          userRoles={userRoles}
          roles={this.props.roles}
          user={user}
        />
      </Table.Row>
    );
  }

  render() {
    const { roleSelectionEnabled, userToRoles, users } = this.props;
    const headers = roleSelectionEnabled ? HEADERS : ROLELESS_HEADERS;

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

    return (
      <div className="user-select">
        {this.renderUserDropdown()}
        <div className="user-list">
          <Table
            data={userRows}
            headers={headers}
            renderRow={this.renderSingleUserRow}
          />
        </div>
      </div>
    );
  }
}
