// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import I18N from 'lib/I18N';
import RemoveButtonCol from 'components/common/RemoveButtonCol';
import RolesCol from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/DashboardUsersTable/RolesCol';
import Table from 'components/ui/Table';
import { noop } from 'util/util';
import type Role from 'services/models/Role';
import type User from 'services/models/User';

type Props = {
  disableRemove?: boolean,
  disableRemoveText?: string,
  onRemoveClick: User => void,
  onUserRoleChange?: (username: string, newRoleName: string) => void,
  requireDeleteConfirmation?: boolean,
  user: User,
  userRoles?: Zen.Array<Role>,
};

export default function UserRow({
  user,
  onRemoveClick,
  disableRemove = false,
  disableRemoveText = '',
  onUserRoleChange = noop,
  requireDeleteConfirmation = false,
  userRoles = Zen.Array.create<Role>(),
}: Props): Array<
  | React.Element<typeof Table.Cell>
  | React.Element<typeof RolesCol>
  | React.Element<typeof RemoveButtonCol>,
> {
  return [
    <Table.Cell key="fullName">{user.getUserFullName()}</Table.Cell>,
    <Table.Cell key="username">{user.username()}</Table.Cell>,
    <RolesCol
      key="userRoles"
      onRoleChange={onUserRoleChange}
      username={user.username()}
      userRoles={userRoles}
    />,
    <RemoveButtonCol
      key="removeButton"
      columnId={user}
      deleteButtonText={I18N.textById('Delete')}
      deleteConfirmationText={I18N.text(
        'Are you sure you want to delete this user?',
      )}
      disabled={disableRemove}
      disabledText={disableRemoveText}
      onRemoveClick={() => onRemoveClick(user)}
      requireDeleteConfirmation={requireDeleteConfirmation}
    />,
  ];
}
