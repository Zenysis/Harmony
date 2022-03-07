// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import RemoveButtonCol from 'components/common/RemoveButtonCol';
import RolesCol from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/DashboardUsersTable/RolesCol';
import Table from 'components/ui/Table';
import autobind from 'decorators/autobind';
import { noop } from 'util/util';
import type Role from 'services/models/Role';
import type User from 'services/models/User';

const TEXT = t('common.user_select.deleteUserPopover');

type DefaultProps = {
  disableRemove: boolean,
  disableRemoveText: string,
  onUserRoleChange: (username: string, newRoleName: string) => void,
  requireDeleteConfirmation: boolean,
  roles: $ReadOnlyArray<string>,
  userRoles: Zen.Array<Role>,
};

type Props = {
  ...DefaultProps,
  onRemoveClick: User => void,
  user: User,
};

export default class UserRow extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    disableRemove: false,
    disableRemoveText: '',
    onUserRoleChange: noop,
    requireDeleteConfirmation: false,
    roles: [],
    userRoles: Zen.Array.create<Role>(),
  };

  @autobind
  onRemoveClick() {
    const { onRemoveClick, user } = this.props;
    onRemoveClick(user);
  }

  render(): Array<
    | React.Element<typeof Table.Cell>
    | React.Element<typeof RolesCol>
    | React.Element<typeof RemoveButtonCol>,
  > {
    const {
      disableRemove,
      disableRemoveText,
      requireDeleteConfirmation,
      user,
      userRoles,
      roles,
      onUserRoleChange,
    } = this.props;

    return [
      <Table.Cell key="fullName">{user.getUserFullName()}</Table.Cell>,
      <Table.Cell key="username">{user.username()}</Table.Cell>,
      <RolesCol
        key="userRoles"
        onRoleChange={onUserRoleChange}
        roles={roles}
        username={user.username()}
        userRoles={userRoles}
      />,
      <RemoveButtonCol
        columnId={user}
        deleteButtonText={TEXT.deleteButton}
        deleteConfirmationText={TEXT.deleteConfirmation}
        disabled={disableRemove}
        disabledText={disableRemoveText}
        key="removeButton"
        onRemoveClick={this.onRemoveClick}
        requireDeleteConfirmation={requireDeleteConfirmation}
      />,
    ];
  }
}
