// @flow
import Promise from 'bluebird';
import React from 'react';

import AlertDefinition from 'models/AlertsApp/AlertDefinition';
import AlertsService from 'services/AlertsService';
import AuthorizationService from 'services/AuthorizationService';
import DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import DashboardService from 'services/DashboardService';
import DeleteUserModal from 'components/AdminApp/DeleteUserModal';
import DirectoryService from 'services/DirectoryService';
import InviteUserBlock from 'components/AdminApp/InviteUserBlock';
import RoleDefinition from 'services/models/RoleDefinition';
import User from 'services/models/User';
import UserManagementBlock from 'components/AdminApp/UserManagementBlock';
import ZenArray from 'util/ZenModel/ZenArray';
import ZenError from 'util/ZenError';
import autobind from 'decorators/autobind';
import withScriptLoader from 'components/common/withScriptLoader';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import { areStringsEqualIgnoreCase } from 'util/stringUtil';
import type { InviteeRequest } from 'services/DirectoryService';
import type { ResourceType } from 'services/AuthorizationService';
import type { UserStatus } from 'services/models/User';

const TEXT = t('admin_app.users');
const INVITE_TEXT = t('admin_app.inviteUserBlock');

type Props = {
  getFullUserProfile: (username: string) => Promise<User>,
  getUsers: () => Promise<ZenArray<User>>,
  updateUser: (user: User) => Promise<User>,
  deleteUser: (user: User) => Promise<void>,
  forceDeleteUser: (user: User) => Promise<void>,
  inviteUser: (invitee: InviteeRequest) => Promise<User>,
  resendUserInvite: (existingUser: User) => Promise<User>,
  getResources: (resourceType: ?ResourceType) => Promise<ZenArray<{}>>,
  getResourceTypes: () => Promise<ZenArray<{}>>,
  getRoles: (resourceType: ?ResourceType) => Promise<ZenArray<RoleDefinition>>,
  getUserDashboards: (username?: string) => Promise<ZenArray<DashboardMeta>>,
  getUserAlerts: (username?: string) => Promise<ZenArray<AlertDefinition>>,
  transferUserAlerts: (sourceUser: User, targetUser: ?User) => Promise<void>,
  transferUserDashboards: (
    sourceUser: User,
    targetUser: ?User,
  ) => Promise<void>,
  resetUserPassword: (user: User) => Promise<void>,
};

type State = {
  users: ZenArray<User>,
  roles: ZenArray<RoleDefinition>,
  selectedStatusFilter: UserStatus | null,
  userToDelete: ?User,
  deletedUserDashboards?: ZenArray<DashboardMeta>,
  userOwnedAlerts?: ZenArray<AlertDefinition>,
  showDeleteUserModal: boolean,
};

class UsersTab extends React.PureComponent<Props, State> {
  static defaultProps = {
    getFullUserProfile: DirectoryService.getUserByUri,
    getUsers: () =>
      DirectoryService.getUsers().then(users => ZenArray.create(users)),
    updateUser: DirectoryService.updateUser,
    forceDeleteUser: DirectoryService.forceDeleteUser,
    deleteUser: DirectoryService.deleteUser,
    inviteUser: DirectoryService.inviteUser,
    resendUserInvite: (user: User) =>
      DirectoryService.inviteUser({
        name: user.firstName(),
        email: user.username(),
      }),
    resetUserPassword: DirectoryService.resetPassword,

    getRoles: (resourceType?: ResourceType) =>
      AuthorizationService.getRoles(resourceType).then(roles =>
        ZenArray.create(roles),
      ),

    getResources: (resourceType?: ResourceType) =>
      AuthorizationService.getResources(resourceType).then(resources =>
        ZenArray.create(resources),
      ),

    getResourceTypes: () =>
      AuthorizationService.getResourceTypes().then(resourceTypes =>
        ZenArray.create(resourceTypes),
      ),

    getUserDashboards: (username: ?string) =>
      DashboardService.getDashboards(username).then(result =>
        ZenArray.create(result),
      ),

    getUserAlerts: (username: ?string) =>
      AlertsService.getAlertDefinitions(username).then(result =>
        ZenArray.create(result),
      ),

    transferUserAlerts: AlertsService.transferAllAlerts,
    transferUserDashboards: DashboardService.transferAllDashboards,
  };

  state = {
    users: ZenArray.create(), // all users
    roles: ZenArray.create(), // all user groups
    selectedStatusFilter: null,
    userToDelete: undefined,
    deletedUserDashboards: undefined,
    userOwnedAlerts: undefined,
    showDeleteUserModal: false,
  };

  componentDidMount(): void {
    // Get all users
    this.props.getUsers().then((users: ZenArray<User>) => {
      this.setState({ users });
    });
    // Get all roles
    this.props.getRoles().then((roles: ZenArray<RoleDefinition>) => {
      this.setState({ roles });
    });
  }

  getUsersToDisplay(): ZenArray<User> {
    const statusFilter = this.state.selectedStatusFilter;
    if (statusFilter) {
      return this.state.users.filter(user => user.status() === statusFilter);
    }
    return this.state.users;
  }

  addInvitedUser(invitedUser: User): void {
    this.setState((state: State) => {
      const userExists = state.users.find((user: User) =>
        areStringsEqualIgnoreCase(user.username(), invitedUser.username()),
      );

      if (!userExists) {
        const users = state.users.push(invitedUser);
        return { users };
      }

      return undefined;
    });
  }

  @autobind
  updateUser(updatedUser: User): Promise<User> {
    return new Promise((resolve, reject) => {
      this.props
        .updateUser(updatedUser)
        .then((_updatedUser: User) => {
          this.setState(
            (state: State) => {
              let { users } = state;
              const userIndex: number = users.findIndex(
                u => u.uri() === _updatedUser.uri(),
              );
              users = users.set(userIndex, _updatedUser);
              return { users };
            },
            () => {
              window.toastr.success(TEXT.updateUserSuccess);
              resolve(_updatedUser);
            },
          );
        })
        .catch(error => {
          window.toastr.error(TEXT.updateUserFail);
          console.error(error);
          reject(new ZenError(error));
        });
    });
  }

  @autobind
  forceDeleteUser(): void {
    const { userToDelete } = this.state;

    if (userToDelete) {
      this.deleteUser(userToDelete, true).then(() => {
        this.setState({
          showDeleteUserModal: false,
          userToDelete: undefined,
          deletedUserDashboards: undefined,
          userOwnedAlerts: undefined,
        });
      });
    }
  }

  @autobind
  cancelDeleteUser(): void {
    this.setState({
      showDeleteUserModal: false,
      userToDelete: undefined,
      deletedUserDashboards: undefined,
      userOwnedAlerts: undefined,
    });
  }

  @autobind
  transferAndDeleteUser(): void {
    const { userToDelete } = this.state;

    // TODO(toshi): Make this cleaner. It's pretty messy right now
    if (userToDelete) {
      this.props.transferUserDashboards(userToDelete).then(() => {
        this.props
          .transferUserAlerts(userToDelete)
          .then(() => this.deleteUser(userToDelete, false))
          .then(() =>
            this.setState({
              showDeleteUserModal: false,
              userToDelete: undefined,
              deletedUserDashboards: undefined,
            }),
          );
      });
    }
  }

  deleteUser(userToDelete: User, forceDeleteUser: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const deleteMethod: User => Promise<void> = forceDeleteUser
        ? this.props.forceDeleteUser
        : this.props.deleteUser;

      deleteMethod(userToDelete)
        .then(() => {
          this.setState(
            (state: State) => {
              const users: ZenArray<User> = state.users.findAndDelete(
                user => user.uri() === userToDelete.uri(),
              );
              return { users };
            },
            () => {
              window.toastr.success(TEXT.deleteUserSuccess);
              resolve();
            },
          );
        })
        .catch(error => {
          console.error(error);
          window.toastr.error(TEXT.deleteUserFail);
          reject(error);
        });
    });
  }

  @autobind
  resendUserInvite(user: User): Promise<void> {
    return new Promise((resolve, reject) => {
      this.props
        .resendUserInvite(user)
        .then(() => {
          window.toastr.success(TEXT.resendInviteSuccess);
          resolve();
        })
        .catch(error => {
          console.error(error);
          window.toastr.error(TEXT.resendInviteFail);
          reject(error);
        });
    });
  }

  @autobind
  resetUserPassword(user: User): Promise<void> {
    return new Promise((resolve, reject) => {
      this.props
        .resetUserPassword(user)
        .then(() => {
          window.toastr.success(TEXT.resetPasswordSuccess);
          resolve();
        })
        .catch(error => {
          console.error(error);
          window.toastr.error(TEXT.resetPasswordFail);
          reject(error);
        });
    });
  }

  @autobind
  onDeleteUserRequested(userToDelete: User): void {
    this.setState({
      userToDelete,
    });

    // TODO(toshi): Aim to change this into a singular function call.
    this.props
      .getUserDashboards(userToDelete.username())
      .then((dashboards: ZenArray<DashboardMeta>) => {
        this.props
          .getUserAlerts(userToDelete.username())
          .then((alerts: ZenArray<AlertDefinition>) => {
            const showDeleteUserModal: boolean =
              alerts.size() > 0 || dashboards.size() > 0;
            this.setState({
              deletedUserDashboards: dashboards,
              userOwnedAlerts: alerts,
              showDeleteUserModal,
            });

            if (!showDeleteUserModal) {
              this.deleteUser(userToDelete, false);
            }
          });
      });
  }

  @autobind
  onUserStatusFilterChange(updatedStatus: UserStatus | null): void {
    this.setState({ selectedStatusFilter: updatedStatus });
  }

  @autobind
  onInviteUser(invitee: InviteeRequest): void {
    window.analytics.track('Admin invited user', {
      email: invitee.email,
      name: invitee.name,
    });

    this.props
      .inviteUser(invitee)
      .then((user: User) => {
        window.toastr.success(INVITE_TEXT.inviteUserSuccess);
        this.addInvitedUser(user);
      })
      .catch(error => {
        window.toastr.error(error.message);
        console.error(error);
      });
  }

  maybeRenderDeleteUserModal() {
    const {
      deletedUserDashboards,
      showDeleteUserModal,
      userOwnedAlerts,
      userToDelete,
    } = this.state;
    if (!showDeleteUserModal || !userToDelete) {
      return null;
    }

    return (
      <DeleteUserModal
        onRequestClose={this.cancelDeleteUser}
        onSafeDelete={this.transferAndDeleteUser}
        onForceDelete={this.forceDeleteUser}
        show={showDeleteUserModal}
        user={userToDelete}
        userAlerts={userOwnedAlerts}
        userDashboards={deletedUserDashboards}
      />
    );
  }

  render() {
    return (
      <React.Fragment>
        <InviteUserBlock onSendInviteRequested={this.onInviteUser} />
        <UserManagementBlock
          deleteUser={this.onDeleteUserRequested}
          getFullUserProfile={this.props.getFullUserProfile}
          getResources={this.props.getResources}
          getResourceTypes={this.props.getResourceTypes}
          getRoles={this.props.getRoles}
          onUserStatusFilterChange={this.onUserStatusFilterChange}
          resendUserInvite={this.resendUserInvite}
          resetUserPassword={this.resetUserPassword}
          roles={this.state.roles}
          selectedUserStatus={this.state.selectedStatusFilter}
          updateUser={this.updateUser}
          users={this.getUsersToDisplay()}
        />
        {this.maybeRenderDeleteUserModal()}
      </React.Fragment>
    );
  }
}

export default withScriptLoader(UsersTab, VENDOR_SCRIPTS.toastr);
