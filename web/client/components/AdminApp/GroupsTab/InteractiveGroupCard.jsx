// @flow
import * as React from 'react';

import AddUserView from 'components/AdminApp/AccessSelectionView/AddUserView';
import AdminAppActionCard from 'components/AdminApp/AdminAppActionCard';
import AdminAppMenuOption from 'components/AdminApp/AdminAppMenu/AdminAppMenuOption';
import DeleteConfirmationModal from 'components/AdminApp/DeleteConfirmationModal';
import DirectoryService from 'services/DirectoryService';
import GroupCardContents from 'components/AdminApp/GroupsTab/GroupCardContents';
import useBoolean from 'lib/hooks/useBoolean';
import type SecurityGroup from 'services/models/SecurityGroup';
import type User from 'services/models/User';

const TEXT = t('admin_app.GroupCard');

type Props = {
  allGroups: $ReadOnlyArray<SecurityGroup>,
  onGroupViewOpen: () => void,
  group: SecurityGroup,
  updateGroupsTab: () => void,
  users: $ReadOnlyArray<User>,

  deleteGroup?: typeof DirectoryService.deleteGroup,
  updateGroupUsers?: typeof DirectoryService.updateGroupUsers,
};

function InteractiveGroupCard({
  allGroups,
  group,
  onGroupViewOpen,
  updateGroupsTab,
  users,
  deleteGroup = DirectoryService.deleteGroup,
  updateGroupUsers = DirectoryService.updateGroupUsers,
}: Props) {
  const [showMenu, openMenu, closeMenu] = useBoolean(false);
  const [showAddUserView, openAddUserView, closeAddUserView] = useBoolean(
    false,
  );
  const [
    showDeleteGroupConfirmationModal,
    openDeleteGroupConfirmationModal,
    closeDeleteGroupConfirmationModal,
  ] = useBoolean(false);

  const onAddUsersClick = () => {
    closeMenu();
    openAddUserView();
  };

  const onEditGroupClick = () => {
    onGroupViewOpen();
    closeMenu();
  };

  const onDeleteGroup = () => {
    deleteGroup(group).then(() => updateGroupsTab());
  };

  const onAddUsersViewClose = () => {
    closeAddUserView();
    openMenu();
  };

  const onDeleteGroupMenuOptionClick = () => {
    closeMenu();
    openDeleteGroupConfirmationModal();
  };

  // NOTE(yitian): Keeping this button here because we will probably come back
  // to using this later.
  /* eslint-disable no-unused-vars */
  const addUsersButton = (
    <AdminAppMenuOption
      iconType="user"
      key="group_user"
      onClick={onAddUsersClick}
      text={TEXT.addUsers}
    />
  );

  const editGroupButton = (
    <AdminAppMenuOption
      iconType="edit"
      key="edit_group"
      onClick={onEditGroupClick}
      text={TEXT.editGroup}
    />
  );

  const deleteGroupModal = (
    <DeleteConfirmationModal
      description={TEXT.deleteGroupWarningMessage}
      onClose={closeDeleteGroupConfirmationModal}
      onPrimaryAction={onDeleteGroup}
      show={showDeleteGroupConfirmationModal}
      title={TEXT.deleteGroup}
    />
  );

  const deleteGroupButton = (
    <AdminAppMenuOption
      iconType="trash"
      key="delete_group"
      onClick={onDeleteGroupMenuOptionClick}
      text={TEXT.deleteGroup}
    />
  );

  const enabledGroupUserNames = React.useMemo(
    () =>
      group
        .users()
        .map(user => user.username())
        .arrayView(),
    [group],
  );

  const onAddUserViewClickSave = (inputUsers: $ReadOnlyArray<User>) => {
    updateGroupUsers(
      group,
      inputUsers.map(user => user.username()),
    ).then(() => updateGroupsTab());
  };

  const addUserView = (
    <AddUserView
      allGroups={allGroups}
      enabledUsernames={enabledGroupUserNames}
      onClickSave={onAddUserViewClickSave}
      onRequestClose={onAddUsersViewClose}
      show={showAddUserView}
      users={users}
    />
  );

  const card = (
    <AdminAppActionCard
      menuOptions={[editGroupButton, deleteGroupButton]}
      onCardClick={onGroupViewOpen}
      onRequestCloseMenu={closeMenu}
      onRequestOpenMenu={openMenu}
      showMenu={showMenu}
      title={group.name()}
    >
      <GroupCardContents group={group} />
    </AdminAppActionCard>
  );

  return (
    <React.Fragment>
      {card}
      {addUserView}
      {deleteGroupModal}
    </React.Fragment>
  );
}

export default (React.memo(
  InteractiveGroupCard,
): React.AbstractComponent<Props>);
