// @flow
import * as React from 'react';

import RemoveButtonCol from 'components/common/RemoveButtonCol';
import Table from 'components/ui/Table';
import UserRolesCol from 'components/common/UserSelect/UserRolesCol';
import ZenArray from 'util/ZenModel/ZenArray';
import autobind from 'decorators/autobind';
import { noop } from 'util/util';
import type Role from 'services/models/Role';
import type RoleDefinition from 'services/models/RoleDefinition';
import type User from 'services/models/User';
import type { ResourceType } from 'services/AuthorizationService';

const TEXT = t('common.user_select.deleteUserPopover');

type Props = {
  onRemoveClick: User => void,
  user: User,

  onUserRoleChange: (
    username: string,
    newRoleNames: $ReadOnlyArray<string>,
    resourceType: ResourceType,
  ) => void,
  requireDeleteConfirmation: boolean,
  roles: ZenArray<RoleDefinition>,
  showProfileIcon: boolean,
  showRolesDropdown: boolean,
  userRoles: ZenArray<Role>,
};

export default class UserRow extends React.PureComponent<Props> {
  static defaultProps = {
    onUserRoleChange: noop,
    requireDeleteConfirmation: false,
    roles: ZenArray.create<RoleDefinition>(),
    showProfileIcon: false,
    showRolesDropdown: true,
    userRoles: ZenArray.create<Role>(),
  };

  @autobind
  onRemoveClick() {
    this.props.onRemoveClick(this.props.user);
  }

  maybeRenderUserRolesColumn() {
    if (!this.props.showRolesDropdown) {
      return null;
    }

    const username = this.props.user.username();

    return (
      <UserRolesCol
        key="userRoles"
        username={username}
        userRoles={this.props.userRoles}
        roles={this.props.roles}
        onUserRoleChange={this.props.onUserRoleChange}
      />
    );
  }

  render() {
    const { requireDeleteConfirmation, showProfileIcon, user } = this.props;
    const iconClass = showProfileIcon ? 'glyphicon glyphicon-user' : undefined;
    const userStatus = user.status();

    if (userStatus === undefined) {
      throw new Error(
        '[UserRow] Should not be rendering a user with undefined status.',
      );
    }

    return [
      <Table.Cell key="fullName">{user.getUserFullName()}</Table.Cell>,
      <Table.Cell key="username">{user.username()}</Table.Cell>,
      <Table.Cell key="phoneNumber">{user.phoneNumber()}</Table.Cell>,
      <Table.Cell key="userStatus">
        {t(`admin_app.user_status_values.${userStatus}`)}
      </Table.Cell>,
      this.maybeRenderUserRolesColumn(),
      <RemoveButtonCol
        key="removeButton"
        columnId={user}
        deleteButtonText={TEXT.deleteButton}
        deleteConfirmationText={TEXT.deleteConfirmation}
        extraIconClass={iconClass}
        onRemoveClick={this.onRemoveClick}
        requireDeleteConfirmation={requireDeleteConfirmation}
      />,
    ];
  }
}
