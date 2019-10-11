// @flow
import * as React from 'react';
import Promise from 'bluebird';

import Table from 'components/ui/Table';
import UserProfileModal from 'components/AdminApp/UserProfileModal';
import UserRow from 'components/common/UserSelect/UserRow';
import ZenArray from 'util/ZenModel/ZenArray';
import autobind from 'decorators/autobind';
import type RoleDefinition from 'services/models/RoleDefinition';
import type User from 'services/models/User';
import type { ResourceType } from 'services/AuthorizationService';

const HEADERS = [
  {
    id: 'name',
    displayContent: t('admin_app.userTableHeaders.name'),
    searchable: u => u.getUserFullName(),
  },
  {
    id: 'email',
    displayContent: t('admin_app.userTableHeaders.email'),
    searchable: u => u.username(),
  },
  {
    id: 'phoneNumber',
    displayContent: t('admin_app.userTableHeaders.phoneNumber'),
  },
  {
    id: 'status',
    displayContent: t('admin_app.userTableHeaders.status'),
    searchable: u => u.status(),
  },
  { id: 'actions', displayContent: '' },
];

type Props = {
  deleteUser: User => void,
  getFullUserProfile: string => Promise<User>,
  getResourceTypes: () => Promise<ZenArray<{}>>,
  getResources: (?ResourceType) => Promise<ZenArray<{}>>,
  getRoles: (?ResourceType) => Promise<ZenArray<RoleDefinition>>,
  resendUserInvite: User => Promise<void>,
  resetUserPassword: User => Promise<void>,
  roles: ZenArray<RoleDefinition>,
  updateUser: User => Promise<User>,
  users: ZenArray<User>,
};

type State = {
  selectedUser: User | void,
};

export default class UserList extends React.PureComponent<Props, State> {
  state = {
    selectedUser: undefined,
  };

  @autobind
  resendUserInvite(): Promise<void> {
    const { selectedUser } = this.state;
    if (selectedUser === undefined) {
      return Promise.resolve();
    }
    return this.props.resendUserInvite(selectedUser);
  }

  @autobind
  resetUserPassword(): Promise<void> {
    const { selectedUser } = this.state;
    if (selectedUser === undefined) {
      return Promise.resolve();
    }
    return this.props.resetUserPassword(selectedUser);
  }

  @autobind
  onRequestUserProfileClose() {
    this.setState({ selectedUser: undefined });
  }

  @autobind
  onRowClick(user: User) {
    this.props.getFullUserProfile(user.uri()).then(fullUserProfile => {
      this.setState({
        selectedUser: fullUserProfile,
      });
    });
  }

  @autobind
  onUserUpdated(user: User) {
    this.props.updateUser(user).then(savedUser => {
      this.setState({ selectedUser: savedUser });
    });
  }

  maybeRenderUserProfileModal() {
    const user = this.state.selectedUser;
    if (!user) {
      return null;
    }

    const remainingRoles = [];
    const {
      roles,
      users,
      resendUserInvite,
      resetUserPassword,
      ...dataAccessMethods
    } = this.props;
    return (
      <UserProfileModal
        onUserUpdated={this.onUserUpdated}
        onRequestClose={this.onRequestUserProfileClose}
        resendUserInvite={this.resendUserInvite}
        resetUserPassword={this.resetUserPassword}
        show={!!user}
        user={user}
        remainingRoles={remainingRoles}
        {...dataAccessMethods}
      />
    );
  }

  @autobind
  renderSingleRow(user: User) {
    return (
      <Table.Row id={`${user.status() || ''}-${user.username()}`}>
        <UserRow
          onRemoveClick={this.props.deleteUser}
          requireDeleteConfirmation
          user={user}
          showProfileIcon
          showRolesDropdown={false}
        />
      </Table.Row>
    );
  }

  render() {
    return (
      <div className="user-list">
        <Table
          adjustWidthsToContent
          data={this.props.users.arrayView()}
          renderRow={this.renderSingleRow}
          headers={HEADERS}
          onRowClick={this.onRowClick}
        />
        {this.maybeRenderUserProfileModal()}
      </div>
    );
  }
}
