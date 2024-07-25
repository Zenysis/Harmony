// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import IdentityRoleMap from 'services/models/IdentityRoleMap';
import RemoveButtonCol from 'components/common/RemoveButtonCol';
import Role from 'services/models/Role';
import Table from 'components/ui/Table';
import User, { USER_STATUS } from 'services/models/User';
import { autobind, memoizeOne } from 'decorators';
import type RoleDefinition from 'services/models/RoleDefinition';
import type { ResourceType } from 'services/AuthorizationService/types';
import type { UserStatus } from 'services/models/User';

export const DEFAULT_STATUSES = [
  USER_STATUS.ACTIVE,
  USER_STATUS.INACTIVE,
  USER_STATUS.PENDING,
];

const COMMON_HEADERS = [
  {
    displayContent: I18N.textById('Name'),
    id: 'name',
    searchable: u => u.getUserFullName(),
  },
  {
    displayContent: I18N.textById('Email'),
    id: 'email',
    searchable: u => u.username(),
  },
  {
    displayContent: I18N.textById('Phone Number'),
    id: 'phoneNumber',
  },
  {
    displayContent: I18N.textById('status'),
    id: 'status',
    searchable: u => u.status(),
  },
];

const HEADERS = [
  ...COMMON_HEADERS,
  { displayContent: I18N.text('Role'), id: 'role' },
  { displayContent: '', id: 'actions', style: { width: 30 } },
];

const ROLELESS_HEADERS = [
  ...COMMON_HEADERS,
  { displayContent: '', id: 'actions', style: { width: 30 } },
];

type DefaultProps = {
  // The default role that new users will be assigned in the dropdown.
  // If not declared, the user will have to explictly select.
  // NOTE: This must be a role that is defined in the `roles` property.
  newUserRole: RoleDefinition | void,

  // A listing of all possible roles
  roles: Zen.Array<RoleDefinition>,

  // Determines whether or not the Role columns should be rendered in this
  // control. If this property is disabled, then when `onUserRolesUpdated`
  // is called, there will be
  roleSelectionEnabled: boolean,

  // The title of the User Select Control
  title: string,

  // TODO - I don't like this property, it's confusing and we should
  // just filter the list of users passed into this control rather than
  // filtering in such a haphazard fashion.
  //
  // Filters the list of available/selectable users based on their status.
  // For a user to appear in the selection dropdown, their status must be
  // one of the statuses defined in this property.
  userStatusFilter: $ReadOnlyArray<UserStatus>,
};

// TODO - Convert all the properties that deal with roles
// to use the new `Role` ZenModel
type Props = {
  ...DefaultProps,

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
  const label = fullName ? `${fullName} - ${username}` : username;
  return label;
}

export default class UserSelect extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    newUserRole: undefined,
    roleSelectionEnabled: true,
    roles: Zen.Array.create<RoleDefinition>(),
    title: I18N.text('Add users'),
    userStatusFilter: DEFAULT_STATUSES,
  };

  @memoizeOne
  getUserStatusFilter(
    userStatusFilter: $ReadOnlyArray<UserStatus>,
  ): Set<UserStatus> {
    return new Set(userStatusFilter);
  }

  @memoizeOne
  getUsernameToUserMapping(users: Zen.Array<User>): Zen.Map<User> {
    return Zen.Map.fromArray(users, 'username');
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
  onUserSelected(user: User) {
    const { newUserRole, userToRoles } = this.props;
    const newRoleName = newUserRole ? newUserRole.name() : '';

    const role = Role.create({
      resourceName: userToRoles.resourceName(),
      resourceType: 'USER',
      roleName: newRoleName,
    });
    this.onUserRolesUpdated(userToRoles.addRole(user.username(), role));
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

  renderUserDropdown(): React.Node {
    const { userStatusFilter, userToRoles, users } = this.props;

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

        return (
          <Dropdown.Option key={label} searchableText={label} value={user}>
            {label}
          </Dropdown.Option>
        );
      });

    return (
      <Dropdown
        defaultDisplayContent={this.props.title}
        enableSearch
        onSelectionChange={this.onUserSelected}
        value={undefined}
      >
        {options.toArray()}
      </Dropdown>
    );
  }

  @autobind
  renderSingleUserRow(user: User): React.Element<typeof Table.Row> {
    const userStatus = user.status();

    if (userStatus === undefined) {
      throw new Error(
        '[UserRow] Should not be rendering a user with undefined status.',
      );
    }
    return (
      <Table.Row id={`${user.status() || ''}-${user.username()}`}>
        <Table.Cell key="fullName">{user.getUserFullName()}</Table.Cell>
        <Table.Cell key="username">{user.username()}</Table.Cell>
        <Table.Cell key="phoneNumber">{user.phoneNumber()}</Table.Cell>
        <Table.Cell key="userStatus">
          <I18N.Ref id={userStatus} />
        </Table.Cell>
        <RemoveButtonCol
          key="removeButton"
          columnId={user}
          deleteButtonText={I18N.textById('Delete')}
          deleteConfirmationText={I18N.textById(
            'Are you sure you want to delete this entry?',
          )}
          onRemoveClick={this.onUserRemoved}
        />
      </Table.Row>
    );
  }

  render(): React.Node {
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
        <div className="user-select-dropdown">{this.renderUserDropdown()}</div>
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
