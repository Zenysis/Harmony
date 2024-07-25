// @flow
import * as React from 'react';

import AdminAppMenu from 'components/AdminApp/AdminAppMenu';
import AdminAppMenuOption from 'components/AdminApp/AdminAppMenu/AdminAppMenuOption';
import I18N from 'lib/I18N';
import useBoolean from 'lib/hooks/useBoolean';
import type User from 'services/models/User';
import type { UserWithGroups } from 'components/AdminApp/constants';

type Props = {
  onDeleteUser: User => void,
  onEditUser: UserWithGroups => void,
  onResetPassword: User => Promise<void>,
  userWithGroups: UserWithGroups,
};

// NOTE: Additional class created to minimize number of re-renders in UserList
function UserListOptions({
  onDeleteUser,
  onEditUser,
  onResetPassword,
  userWithGroups,
}: Props) {
  const [showMenu, openMenu, closeMenu] = useBoolean(false);

  const onEditClick = () => {
    closeMenu();
    onEditUser(userWithGroups);
  };
  const editUserMenuItem = (
    <AdminAppMenuOption
      iconType="edit"
      onClick={onEditClick}
      text={I18N.text('Edit User')}
    />
  );

  const onResetPasswordClick = () => {
    closeMenu();
    onResetPassword(userWithGroups.user);
  };
  const resetPasswordMenuItem = (
    <AdminAppMenuOption
      iconType="refresh"
      onClick={onResetPasswordClick}
      text={I18N.text('Reset Password')}
    />
  );

  const onDeleteClick = () => {
    closeMenu();
    onDeleteUser(userWithGroups.user);
  };
  const deleteUserMenuItem = (
    <AdminAppMenuOption
      iconType="remove"
      onClick={onDeleteClick}
      text={I18N.text('Delete User')}
    />
  );

  return (
    <AdminAppMenu
      onRequestCloseMenu={closeMenu}
      onRequestOpenMenu={openMenu}
      showMenu={showMenu}
    >
      {editUserMenuItem}
      {resetPasswordMenuItem}
      {deleteUserMenuItem}
    </AdminAppMenu>
  );
}

export default (React.memo(UserListOptions): React.AbstractComponent<Props>);
