// @flow
import * as React from 'react';
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import AlertsService from 'services/AlertsService';
import DashboardService from 'services/DashboardBuilderApp/DashboardService';
import DeleteConfirmationModal from 'components/AdminApp/DeleteConfirmationModal';
import DeleteUserModal from 'components/AdminApp/DeleteUserModal';
import DirectoryService from 'services/DirectoryService';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import InteractivePill from 'components/AdminApp/InteractivePill';
import Table from 'components/ui/Table';
import Toaster from 'components/ui/Toaster';
import UserListOptions from 'components/AdminApp/UsersTab/UserListOptions';
import UserViewModal from 'components/AdminApp/UsersTab/UserViewModal';
import { RESOURCE_TYPES } from 'services/AuthorizationService/registry';
import { autobind, memoizeOne } from 'decorators';
import type AlertDefinition from 'models/AlertsApp/AlertDefinition';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import type Resource from 'services/models/Resource';
import type RoleDefinition from 'services/models/RoleDefinition';
import type SecurityGroup from 'services/models/SecurityGroup';
import type User from 'services/models/User';
import type { UserWithGroups } from 'components/AdminApp/constants';

export function searchRoles(userWithGroups: UserWithGroups): string {
  return userWithGroups.user
    .roles()
    .mapValues(role => role.label())
    .join(' ');
}

export function searchGroups(userWithGroups: UserWithGroups): string {
  return userWithGroups.groups.mapValues(role => role.name()).join(' ');
}

export function mergeData(
  users: Zen.Array<User>,
  usersToGroups: Zen.Map<Zen.Array<SecurityGroup>>,
): $ReadOnlyArray<UserWithGroups> {
  return users.mapValues(user => ({
    user,
    groups: usersToGroups.get(user.username(), Zen.Array.create()),
  }));
}

const NAME_COL_NAME = 'name';

const HEADERS = [
  {
    displayContent: I18N.textById('Name'),
    id: NAME_COL_NAME,
    searchable: obj => obj.user.getUserFullName(),
    sortFn: Table.Sort.string(obj => obj.user.getUserFullName()),
  },
  {
    displayContent: I18N.textById('Email'),
    id: 'email',
    searchable: obj => obj.user.username(),
  },
  {
    displayContent: I18N.textById('Status'),
    id: 'status',
    searchable: obj => {
      const str = obj.user.status();
      return I18N.textById(str);
    },
  },
  {
    displayContent: I18N.textById('Roles'),
    id: 'roles',
    searchable: searchRoles,
  },
  {
    displayContent: I18N.textById('Groups'),
    id: 'groups',
    searchable: searchGroups,
  },
  { displayContent: '', id: 'actions' },
];

type Props = {
  alertDefinitions: $ReadOnlyArray<AlertDefinition>,
  alertResources: $ReadOnlyArray<Resource>,
  dashboards: $ReadOnlyArray<DashboardMeta>,
  groups: $ReadOnlyArray<SecurityGroup>,
  onUsersMutated: () => void,
  roleMemberCounts: {
    +[roleId: string]: number,
    ...,
  },
  roles: $ReadOnlyArray<RoleDefinition>,
  searchText: string,
  users: Zen.Array<User>,
  userToGroups: Zen.Map<Zen.Array<SecurityGroup>>,
};

type State = {
  selectedUser?: UserWithGroups,
  userOwnedResources: $ReadOnlyArray<Resource>,
  userToConfirmDelete?: User,
  userToTransferOwnership?: User,
};

type DefaultProps = {
  searchText: string,
};

export default class UserList extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    searchText: '',
  };

  state: State = {
    selectedUser: undefined,
    userOwnedResources: [],
    userToConfirmDelete: undefined,
    userToTransferOwnership: undefined,
  };

  @memoizeOne
  mergeUserData(
    users: Zen.Array<User>,
    usersToGroups: Zen.Map<Zen.Array<SecurityGroup>>,
  ): $ReadOnlyArray<UserWithGroups> {
    return mergeData(users, usersToGroups);
  }

  deleteUser(
    userToTransferOwnership: User,
    shouldForceDelete: boolean,
  ): Promise<void> {
    const { onUsersMutated } = this.props;
    return new Promise((resolve, reject) => {
      const deleteMethod = shouldForceDelete
        ? DirectoryService.forceDeleteUser
        : DirectoryService.deleteUser;
      deleteMethod(userToTransferOwnership)
        .then(() => {
          onUsersMutated();
          Toaster.success(I18N.text('The user was successfully deleted.'));
          resolve();
        })
        .catch(error => {
          Toaster.error(I18N.text('There was an error deleting the user.'));
          reject(error);
        });
    });
  }

  @autobind
  forceDeleteUser(): void {
    const { userToTransferOwnership } = this.state;

    if (userToTransferOwnership) {
      this.deleteUser(userToTransferOwnership, true).then(() => {
        this.setState({
          userOwnedResources: [],
          userToTransferOwnership: undefined,
        });
      });
    }
  }

  @autobind
  transferAndDeleteUser(): void {
    const { userToTransferOwnership } = this.state;

    if (userToTransferOwnership) {
      DashboardService.transferAllDashboards(userToTransferOwnership).then(
        () => {
          AlertsService.transferAllAlerts(userToTransferOwnership)
            .then(() => this.deleteUser(userToTransferOwnership, false))
            .then(() =>
              this.setState({
                userOwnedResources: [],
                userToTransferOwnership: undefined,
              }),
            );
        },
      );
    }
  }

  @autobind
  resendUserInvite(user: User): Promise<User> {
    return new Promise((resolve, reject) => {
      DirectoryService.inviteUser({
        email: user.username(),
        name: user.firstName(),
      })
        .then(() => {
          Toaster.success(
            I18N.text('Successfully resent an invitation e-mail to the user.'),
          );
          resolve();
        })
        .catch(error => {
          Toaster.error(
            I18N.text('There was an error resending the user an invitation.'),
          );
          reject(error);
        });
    });
  }

  @autobind
  onRowClick(userWithGroups: UserWithGroups): void {
    this.setState({ selectedUser: userWithGroups });
  }

  @autobind
  onCloseModalButtonClick(): void {
    this.setState({ selectedUser: undefined });
  }

  @autobind
  onCancelDeleteUser(): void {
    this.setState({
      userOwnedResources: [],
      userToTransferOwnership: undefined,
    });
  }

  /**
   * Run when admin requests to delete a user
   */
  @autobind
  onDeleteUserRequested(user: User): void {
    this.setState({ userToConfirmDelete: user });
  }

  /**
   * Even after an admin confirms they would like to delete a user, we have to
   * check for items owned by this user.
   */
  @autobind
  onDeleteUserConfirmation(): void {
    const { userToConfirmDelete } = this.state;
    if (userToConfirmDelete === undefined) {
      return;
    }

    // Close the initial confirmation modal
    this.setState({
      userToConfirmDelete: undefined,
    });
    DirectoryService.getUserOwnership(userToConfirmDelete.uri())
      .then(ownedResources => {
        if (ownedResources.length === 0) {
          this.deleteUser(userToConfirmDelete, false);
        } else {
          this.setState({
            userOwnedResources: ownedResources,
            userToTransferOwnership: userToConfirmDelete,
          });
        }
      })
      .catch(() => {
        Toaster.error(I18N.textById('There was an error deleting the user.'));
      });
  }

  @autobind
  onResetPassword(user: User): Promise<void> {
    return new Promise((resolve, reject) => {
      DirectoryService.resetPassword(user)
        .then(() => {
          Toaster.success(I18N.text("Sucessfully reset the user's password."));
          resolve();
        })
        .catch(error => {
          Toaster.error(
            I18N.text("There was an error resetting the user's password."),
          );
          reject(error);
        });
    });
  }

  @autobind
  onDeleteUserConfirmationCancel() {
    this.setState({ userToConfirmDelete: undefined });
  }

  maybeRenderDeleteUserModal(): React.Element<typeof DeleteUserModal> | null {
    const { userOwnedResources, userToTransferOwnership } = this.state;
    if (userToTransferOwnership === undefined) {
      return null;
    }

    const userAlertResources = userOwnedResources.filter(
      resource => resource.resourceType() === RESOURCE_TYPES.ALERT,
    );
    const userDashboardResources = userOwnedResources.filter(
      resource => resource.resourceType() === RESOURCE_TYPES.DASHBOARD,
    );

    return (
      <DeleteUserModal
        onForceDelete={this.forceDeleteUser}
        onRequestClose={this.onCancelDeleteUser}
        onSafeDelete={this.transferAndDeleteUser}
        show
        user={userToTransferOwnership}
        userAlertResources={userAlertResources}
        userDashboardResources={userDashboardResources}
      />
    );
  }

  @autobind
  maybeRenderUserProfileModal(): React.Element<typeof UserViewModal> | null {
    const { selectedUser } = this.state;
    const {
      alertDefinitions,
      alertResources,
      dashboards,
      groups,
      roleMemberCounts,
      roles,
    } = this.props;
    if (selectedUser === undefined) {
      return null;
    }

    return (
      <UserViewModal
        alertDefinitions={alertDefinitions}
        alertResources={alertResources}
        dashboards={dashboards}
        groups={groups}
        onCloseModal={this.onCloseModalButtonClick}
        onResendUserInvite={this.resendUserInvite}
        onResetPassword={this.onResetPassword}
        onUserUpdate={this.props.onUsersMutated}
        roleMemberCounts={roleMemberCounts}
        roles={roles}
        user={selectedUser.user}
        userGroups={selectedUser.groups}
      />
    );
  }

  @autobind
  renderDeleteUserConfirmationModal(): React.Node {
    return (
      <DeleteConfirmationModal
        description={I18N.text(
          'Are you sure you want to permanently delete this user?',
        )}
        onClose={this.onDeleteUserConfirmationCancel}
        onPrimaryAction={this.onDeleteUserConfirmation}
        show={this.state.userToConfirmDelete !== undefined}
        title={I18N.textById('Delete User')}
      />
    );
  }

  @autobind
  renderRoles(user: User): React.Node {
    const rolePills = user.roles().mapValues((role, index) => (
      <div key={index}>
        <InteractivePill
          className="role-card__pill"
          pillType="role"
          role={role}
        />
      </div>
    ));
    return (
      // Adding negative margin here so the pills align with the text in other
      // cells of the table.
      <Group.Vertical flex spacing="xxxs" style={{ marginTop: '-4px' }}>
        {rolePills}
      </Group.Vertical>
    );
  }

  @autobind
  renderGroups(groups: Zen.Array<SecurityGroup>): React.Node {
    if (groups.isEmpty()) {
      return null;
    }
    const groupPills = groups.mapValues((group, index) => (
      <InteractivePill
        key={index}
        className="group-card__pill"
        group={group}
        pillType="group"
      />
    ));
    return <Group.Vertical spacing="xxs">{groupPills}</Group.Vertical>;
  }

  @autobind
  renderSingleRow(
    userWithGroups: UserWithGroups,
  ): React.Element<typeof Table.Row> {
    const { groups, user } = userWithGroups;
    const userStatus = user.status();

    if (userStatus === undefined) {
      throw new Error(
        '[UserRow] Should not be rendering a user with undefined status.',
      );
    }
    return (
      <Table.Row id={`${user.status() || ''}-${user.username()}`}>
        <Table.Cell>{user.getUserFullName()}</Table.Cell>
        <Table.Cell>{user.username()}</Table.Cell>
        <Table.Cell>
          <I18N.Ref id={userStatus} />
        </Table.Cell>
        <Table.Cell>{this.renderRoles(user)}</Table.Cell>
        <Table.Cell>{this.renderGroups(groups)}</Table.Cell>
        <Table.Cell>
          <UserListOptions
            onDeleteUser={this.onDeleteUserRequested}
            onEditUser={this.onRowClick}
            onResetPassword={this.onResetPassword}
            userWithGroups={userWithGroups}
          />
        </Table.Cell>
      </Table.Row>
    );
  }

  render(): React.Node {
    const { searchText, userToGroups, users } = this.props;
    return (
      <div className="user-list">
        <Table
          adjustWidthsToContent
          data={this.mergeUserData(users, userToGroups)}
          headers={HEADERS}
          initialColumnToSort={NAME_COL_NAME}
          onRowClick={this.onRowClick}
          renderRow={this.renderSingleRow}
          searchText={searchText}
        />
        {this.maybeRenderUserProfileModal()}
        {this.maybeRenderDeleteUserModal()}
        {this.renderDeleteUserConfirmationModal()}
      </div>
    );
  }
}
