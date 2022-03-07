// @flow
import * as React from 'react';

import AddUserView from 'components/AdminApp/AccessSelectionView/AddUserView';
import AdminAppActionCard from 'components/AdminApp/AdminAppActionCard';
import AdminAppMenuOption from 'components/AdminApp/AdminAppMenu/AdminAppMenuOption';
import AuthorizationService from 'services/AuthorizationService';
import DeleteConfirmationModal from 'components/AdminApp/DeleteConfirmationModal';
import RoleCardContents from 'components/AdminApp/RoleManagementTab/RoleCardContents';
import useBoolean from 'lib/hooks/useBoolean';
import { IMMUTABLE_ROLES } from 'services/models/RoleDefinition';
import { noop } from 'util/util';
import type RoleDefinition from 'services/models/RoleDefinition';
import type SecurityGroup from 'services/models/SecurityGroup';
import type User from 'services/models/User';

const TEXT = t('admin_app.RoleCard');

type Props = {
  deleteRole?: typeof AuthorizationService.deleteRole,
  groups: $ReadOnlyArray<SecurityGroup>,
  onRoleViewOpen: () => void,
  role: RoleDefinition,
  updateRolesTab: () => void,
  updateRoleUsers?: typeof AuthorizationService.updateRoleUsers,
  updateUsersTab: () => void,
  users: $ReadOnlyArray<User>,
};

function InteractiveRoleCard({
  groups,
  onRoleViewOpen,
  role,
  updateRolesTab,
  updateUsersTab,
  users,
  deleteRole = AuthorizationService.deleteRole,
  updateRoleUsers = AuthorizationService.updateRoleUsers,
}: Props) {
  const [showMenu, openMenu, closeMenu] = useBoolean(false);
  const [showAddUserView, openAddUserView, closeAddUserView] = useBoolean(
    false,
  );
  const [
    showDeleteRoleConfirmationModal,
    openDeleteRoleConfirmationModal,
    closeDeleteRoleConfirmationModal,
  ] = useBoolean(false);

  // NOTE(all): We treat the site admin card special
  const isAdminCard = IMMUTABLE_ROLES.includes(role.name());

  const onEditUsersClick = () => {
    closeMenu();
    openAddUserView();
  };

  const onEditRoleClick = () => {
    if (isAdminCard) {
      return;
    }
    onRoleViewOpen();
    closeMenu();
  };

  const onDeleteRole = () => {
    deleteRole(role).then(() => updateRolesTab());
  };

  const onAddUsersViewClose = () => {
    closeAddUserView();
    openMenu();
  };

  const onDeleteRoleMenuOptionClick = () => {
    closeMenu();
    openDeleteRoleConfirmationModal();
  };

  const editUsersButton = (
    <AdminAppMenuOption
      key="edit_role_users"
      iconType="user"
      onClick={onEditUsersClick}
      text={TEXT.editUsers}
    />
  );

  const editRoleButton = (
    <AdminAppMenuOption
      key="edit_role"
      iconType="edit"
      onClick={onEditRoleClick}
      text={TEXT.editRole}
    />
  );

  const deleteRoleModal = (
    <DeleteConfirmationModal
      description={TEXT.deleteRoleWarningMessage}
      onClose={closeDeleteRoleConfirmationModal}
      onPrimaryAction={onDeleteRole}
      show={showDeleteRoleConfirmationModal}
      title={TEXT.deleteRole}
    />
  );

  const deleteRoleButton = (
    <AdminAppMenuOption
      key="delete_role"
      iconType="trash"
      onClick={onDeleteRoleMenuOptionClick}
      text={TEXT.deleteRole}
    />
  );

  const onAddUserViewClickSave = (inputUsers: $ReadOnlyArray<User>) => {
    updateRoleUsers(
      role,
      inputUsers.map(user => user.username()),
    ).then(() => {
      updateRolesTab();
      updateUsersTab();
    });
  };

  const addUserView = (
    <AddUserView
      allGroups={groups}
      enabledUsernames={role.usernames().arrayView()}
      onClickSave={onAddUserViewClickSave}
      onRequestClose={onAddUsersViewClose}
      show={showAddUserView}
      users={users}
    />
  );

  const card = (
    <AdminAppActionCard
      isAdminCard={isAdminCard}
      menuOptions={
        isAdminCard
          ? [editUsersButton]
          : [editRoleButton, editUsersButton, deleteRoleButton]
      }
      onCardClick={isAdminCard ? noop : onRoleViewOpen}
      onRequestCloseMenu={closeMenu}
      onRequestOpenMenu={openMenu}
      showMenu={showMenu}
      title={role.label()}
    >
      <RoleCardContents role={role} />
    </AdminAppActionCard>
  );

  return (
    <React.Fragment>
      {card}
      {addUserView}
      {deleteRoleModal}
    </React.Fragment>
  );
}

export default (React.memo(
  InteractiveRoleCard,
): React.AbstractComponent<Props>);
