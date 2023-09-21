// @flow
import * as React from 'react';

import AddUserView from 'components/AdminApp/AccessSelectionView/AddUserView';
import AdminAppActionCard from 'components/AdminApp/AdminAppActionCard';
import AdminAppMenuOption from 'components/AdminApp/AdminAppMenu/AdminAppMenuOption';
import AuthorizationService from 'services/AuthorizationService';
import DeleteConfirmationModal from 'components/AdminApp/DeleteConfirmationModal';
import I18N from 'lib/I18N';
import RoleCardContents from 'components/AdminApp/RoleManagementTab/RoleCardContents';
import useBoolean from 'lib/hooks/useBoolean';
import { IMMUTABLE_ROLES } from 'services/models/RoleDefinition';
import { noop } from 'util/util';
import type RoleDefinition from 'services/models/RoleDefinition';
import type SecurityGroup from 'services/models/SecurityGroup';
import type User from 'services/models/User';

type Props = {
  groups: $ReadOnlyArray<SecurityGroup>,
  onRoleViewOpen: () => void,
  role: RoleDefinition,
  updateRolesTab: () => void,
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

  // NOTE: We treat the site admin card special
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
    AuthorizationService.deleteRole(role).then(() => updateRolesTab());
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
      text={I18N.text('Edit Users')}
    />
  );

  const editRoleButton = (
    <AdminAppMenuOption
      key="edit_role"
      iconType="edit"
      onClick={onEditRoleClick}
      text={I18N.text('Edit Role')}
    />
  );

  const deleteRoleModal = (
    <DeleteConfirmationModal
      description={I18N.text(
        'Are you sure you want to permanently delete this role?',
      )}
      onClose={closeDeleteRoleConfirmationModal}
      onPrimaryAction={onDeleteRole}
      show={showDeleteRoleConfirmationModal}
      title={I18N.text('Delete Role')}
    />
  );

  const deleteRoleButton = (
    <AdminAppMenuOption
      key="delete_role"
      iconType="trash"
      onClick={onDeleteRoleMenuOptionClick}
      text={I18N.textById('Delete Role')}
    />
  );

  const onAddUserViewClickSave = (inputUsers: $ReadOnlyArray<User>) => {
    AuthorizationService.updateRoleUsers(
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
