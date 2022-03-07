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
const TEXT = t('admin_app.UsersTab.UserList');

const HEADERS = [
  {
    id: NAME_COL_NAME,
    displayContent: TEXT.name,
    searchable: obj => obj.user.getUserFullName(),
    sortFn: Table.Sort.string(obj => obj.user.getUserFullName()),
  },
  {
    id: 'email',
    displayContent: TEXT.email,
    searchable: obj => obj.user.username(),
  },
  {
    id: 'status',
    displayContent: TEXT.status,
    searchable: obj => t(`admin_app.user_status_values.${obj.user.status()}`),
  },
  {
    id: 'roles',
    displayContent: TEXT.roles,
    searchable: searchRoles,
  },
  {
    id: 'groups',
    displayContent: TEXT.groups,
    searchable: searchGroups,
  },
  { id: 'actions', displayContent: '' },
];

type Props = {
  alertDefinitions: $ReadOnlyArray<AlertDefinition>,
  alertResources: $ReadOnlyArray<Resource>,
  dashboards: $ReadOnlyArray<DashboardMeta>,
  deleteUser: (user: User) => Promise<void>,
  forceDeleteUser: (user: User) => Promise<void>,
  getUserOwnership: (uri: string) => Promise<Array<Resource>>,
  groups: $ReadOnlyArray<SecurityGroup>,
  onUsersMutated: () => void,
  resendUserInvite: (existingUser: User) => Promise<User>,
  resetUserPassword: (user: User) => Promise<void>,
  roleMemberCounts: {
    +[roleId: string]: number,
    ...,
  },
  roles: $ReadOnlyArray<RoleDefinition>,
  searchText: string,
  transferUserAlerts: (sourceUser: User, targetUser?: User) => Promise<void>,
  transferUserDashboards: (
    sourceUser: User,
    targetUser?: User,
  ) => Promise<void>,
  users: Zen.Array<User>,
  userToGroups: Zen.Map<Zen.Array<SecurityGroup>>,
};

type State = {
  selectedUser?: UserWithGroups,
  userOwnedResources: $ReadOnlyArray<Resource>,
  userToTransferOwnership?: User,
  userToConfirmDelete?: User,
};

type DefaultProps = {
  deleteUser: typeof DirectoryService.deleteUser,
  forceDeleteUser: typeof DirectoryService.forceDeleteUser,
  getUserOwnership: typeof DirectoryService.getUserOwnership,
  resendUserInvite: (user: User) => Promise<User>,
  resetUserPassword: typeof DirectoryService.resetPassword,
  searchText: string,
  transferUserAlerts: typeof AlertsService.transferAllAlerts,
  transferUserDashboards: typeof DashboardService.transferAllDashboards,
};

export default class UserList extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    deleteUser: DirectoryService.deleteUser,
    forceDeleteUser: DirectoryService.forceDeleteUser,
    getUserOwnership: DirectoryService.getUserOwnership,
    resendUserInvite: (user: User) =>
      DirectoryService.inviteUser({
        name: user.firstName(),
        email: user.username(),
      }),
    resetUserPassword: DirectoryService.resetPassword,
    searchText: '',
    transferUserAlerts: AlertsService.transferAllAlerts,
    transferUserDashboards: DashboardService.transferAllDashboards,
  };

  state: State = {
    selectedUser: undefined,
    userOwnedResources: [],
    userToTransferOwnership: undefined,
    userToConfirmDelete: undefined,
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
    const { deleteUser, forceDeleteUser, onUsersMutated } = this.props;
    return new Promise((resolve, reject) => {
      const deleteMethod = shouldForceDelete ? forceDeleteUser : deleteUser;
      deleteMethod(userToTransferOwnership)
        .then(() => {
          onUsersMutated();
          analytics.track('User deleted', {
            changedUser: userToTransferOwnership.username(),
          });
          Toaster.success(TEXT.deleteUserSuccess);
          resolve();
        })
        .catch(error => {
          Toaster.error(TEXT.deleteUserFail);
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
    const { transferUserAlerts, transferUserDashboards } = this.props;

    if (userToTransferOwnership) {
      transferUserDashboards(userToTransferOwnership).then(() => {
        transferUserAlerts(userToTransferOwnership)
          .then(() => this.deleteUser(userToTransferOwnership, false))
          .then(() =>
            this.setState({
              userOwnedResources: [],
              userToTransferOwnership: undefined,
            }),
          );
      });
    }
  }

  @autobind
  resendUserInvite(user: User): Promise<User> {
    return new Promise((resolve, reject) => {
      this.props
        .resendUserInvite(user)
        .then(() => {
          Toaster.success(TEXT.resendInviteSuccess);
          resolve();
        })
        .catch(error => {
          Toaster.error(TEXT.resendInviteFail);
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
    this.props
      .getUserOwnership(userToConfirmDelete.uri())
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
        Toaster.error(TEXT.deleteUserFail);
      });
  }

  @autobind
  onResetPassword(user: User): Promise<void> {
    return new Promise((resolve, reject) => {
      this.props
        .resetUserPassword(user)
        .then(() => {
          Toaster.success(TEXT.resetPasswordSuccess);
          resolve();
        })
        .catch(error => {
          Toaster.error(TEXT.resetPasswordFail);
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
        onRequestClose={this.onCancelDeleteUser}
        onSafeDelete={this.transferAndDeleteUser}
        onForceDelete={this.forceDeleteUser}
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
        description={TEXT.userDeletionConfirmModalPrompt}
        onClose={this.onDeleteUserConfirmationCancel}
        onPrimaryAction={this.onDeleteUserConfirmation}
        show={this.state.userToConfirmDelete !== undefined}
        title={TEXT.userDeletionConfirmModalTitle}
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
        className="group-card__pill"
        pillType="group"
        group={group}
        key={index}
      />
    ));
    return <Group.Vertical spacing="xxs">{groupPills}</Group.Vertical>;
  }

  @autobind
  renderSingleRow(
    userWithGroups: UserWithGroups,
  ): React.Element<typeof Table.Row> {
    const { user, groups } = userWithGroups;
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
          {t(`admin_app.user_status_values.${userStatus}`)}
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
    const { searchText, users, userToGroups } = this.props;
    return (
      <div className="user-list">
        <Table
          adjustWidthsToContent
          data={this.mergeUserData(users, userToGroups)}
          initialColumnToSort={NAME_COL_NAME}
          renderRow={this.renderSingleRow}
          headers={HEADERS}
          onRowClick={this.onRowClick}
          searchText={searchText}
        />
        {this.maybeRenderUserProfileModal()}
        {this.maybeRenderDeleteUserModal()}
        {this.renderDeleteUserConfirmationModal()}
      </div>
    );
  }
}
